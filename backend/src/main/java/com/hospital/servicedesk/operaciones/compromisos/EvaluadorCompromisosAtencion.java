package com.hospital.servicedesk.operaciones.compromisos;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.operaciones.compromisos.aplicacion.ResumenCicloMonitor;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.CalculadoraCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.TicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class EvaluadorCompromisosAtencion {

    static final Set<EstadoTicket> ACTIVOS = EnumSet.of(EstadoTicket.ABIERTO, EstadoTicket.EN_PROGRESO, EstadoTicket.ESCALADO);

    enum Resultado { SIN_CAMBIO, EN_RIESGO, VENCIDO }

    private final TicketRepository ticketRepository;
    private final AuditoriaTicketService auditoria;
    private final ApplicationEventPublisher eventos;
    private final PropiedadesCompromisoAtencion propiedades;
    private final TransactionTemplate transaccion;
    private final Clock clock;

    private final ReentrantLock enCurso = new ReentrantLock();
    private final AtomicReference<ResumenCicloMonitor> ultimoCiclo = new AtomicReference<>();

    public EvaluadorCompromisosAtencion(TicketRepository ticketRepository, AuditoriaTicketService auditoria,
                                        ApplicationEventPublisher eventos, PropiedadesCompromisoAtencion propiedades,
                                        PlatformTransactionManager txManager, Clock clock) {
        this.ticketRepository = ticketRepository;
        this.auditoria = auditoria;
        this.eventos = eventos;
        this.propiedades = propiedades;
        this.transaccion = new TransactionTemplate(txManager);
        this.clock = clock;
    }

    public ResumenCicloMonitor ejecutarCiclo() {
        if (!enCurso.tryLock()) {
            throw new ConflictoNegocioException("Ya hay una evaluación de compromisos de atención en curso.");
        }
        try {
            LocalDateTime inicio = LocalDateTime.now(clock);
            int evaluados = 0, riesgo = 0, vencidos = 0, errores = 0;
            Integer cursor = 0;
            List<Integer> lote;
            do {
                lote = ticketRepository.idsParaMonitoreo(ACTIVOS, EstadoSLA.VENCIDO, cursor,
                        PageRequest.of(0, propiedades.tamanoLote()));
                for (Integer id : lote) {
                    evaluados++;
                    try {
                        switch (Objects.requireNonNull(transaccion.execute(tx -> procesar(id, inicio)))) {
                            case EN_RIESGO -> riesgo++;
                            case VENCIDO -> vencidos++;
                            case SIN_CAMBIO -> { }
                        }
                    } catch (RuntimeException e) {
                        errores++;
                        log.error("No se pudo evaluar el compromiso del ticket #{}: {}", id, e.getMessage(), e);
                    }
                }
                if (!lote.isEmpty()) cursor = lote.getLast();
            } while (lote.size() == propiedades.tamanoLote());

            ResumenCicloMonitor resumen = new ResumenCicloMonitor(inicio,
                    Duration.between(inicio, LocalDateTime.now(clock)), evaluados, riesgo, vencidos, errores);
            ultimoCiclo.set(resumen);
            if (riesgo + vencidos + errores > 0) {
                log.info("Monitor de compromisos: {} evaluados, {} en riesgo, {} vencidos, {} errores",
                        evaluados, riesgo, vencidos, errores);
            }
            return resumen;
        } finally {
            enCurso.unlock();
        }
    }

    public Optional<ResumenCicloMonitor> ultimoCiclo() {
        return Optional.ofNullable(ultimoCiclo.get());
    }

    Resultado procesar(Integer id, LocalDateTime ahora) {
        Optional<Ticket> encontrado = ticketRepository.findConAreaYTecnicoByIdTicket(id);
        if (encontrado.isEmpty() || !ACTIVOS.contains(encontrado.get().getEstado())) return Resultado.SIN_CAMBIO;
        Ticket t = encontrado.get();

        EstadoSLA actual = t.getEstadoSla() == null ? EstadoSLA.DENTRO_TIEMPO : t.getEstadoSla();
        if (actual == EstadoSLA.VENCIDO) return Resultado.SIN_CAMBIO;

        var evaluacion = CalculadoraCompromisoAtencion.evaluar(t.getFechaCreacion(), t.getFechaLimiteResolucion(), ahora, propiedades.umbralRiesgo());
        EstadoSLA calculado = evaluacion.estado();

        if (calculado.ordinal() <= actual.ordinal()) return Resultado.SIN_CAMBIO;

        int filas = ticketRepository.avanzarEstadoCompromiso(t.getIdTicket(), actual, calculado, ACTIVOS);
        if (filas == 0) return Resultado.SIN_CAMBIO;

        t.setEstadoSla(calculado);
        auditoria.registrar(RegistroAuditoriaTicket.builder()
                .ticket(t)
                .actor(null)
                .accion("MONITOR_SLA")
                .estadoAnterior(actual.name())
                .estadoNuevo(calculado.name())
                .motivo("Evaluación automática de compromiso de atención")
                .detalle("Fracción consumida: " + String.format(Locale.ROOT, "%.2f", evaluacion.fraccionConsumida()))
                .ipOrigen(null)
                .build());

        eventos.publishEvent(CompromisoAtencionCambiadoEvento.desde(t, actual, calculado));
        return calculado == EstadoSLA.VENCIDO ? Resultado.VENCIDO : Resultado.EN_RIESGO;
    }
}
