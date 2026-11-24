import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 5A. Config
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/config/PropiedadesCompromisoAtencion.java", """package com.hospital.servicedesk.operaciones.compromisos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties(prefix = "servicedesk.compromisos")
public record PropiedadesCompromisoAtencion(
        @DefaultValue("true") boolean monitorHabilitado,
        @DefaultValue("60000") long intervaloMs,
        @DefaultValue("0.70") double umbralRiesgo,
        @DefaultValue("200") int tamanoLote,
        @DefaultValue List<String> correosSupervision) {

    public PropiedadesCompromisoAtencion {
        if (umbralRiesgo <= 0 || umbralRiesgo >= 1) {
            throw new IllegalArgumentException("servicedesk.compromisos.umbral-riesgo debe estar entre 0 y 1");
        }
        correosSupervision = correosSupervision == null ? List.of()
                : List.copyOf(correosSupervision);
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/config/ConfiguracionTareasSegundoPlano.java", """package com.hospital.servicedesk.operaciones.compromisos.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Map;
import java.util.concurrent.Executor;

@Configuration
@EnableScheduling
@EnableAsync
public class ConfiguracionTareasSegundoPlano {

    public static final String EJECUTOR_NOTIFICACIONES = "ejecutorNotificaciones";

    @Bean(name = EJECUTOR_NOTIFICACIONES)
    public Executor ejecutorNotificaciones() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("NotifSLA-");
        executor.setTaskDecorator(tarea -> {
            Map<String, String> contexto = MDC.getCopyOfContextMap();
            return () -> {
                if (contexto != null) MDC.setContextMap(contexto);
                try { tarea.run(); } finally { MDC.clear(); }
            };
        });
        executor.initialize();
        return executor;
    }
}
""")

# 5C & 5B. Domain
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/dominio/CalculadoraCompromisoAtencion.java", """package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.EstadoSLA;

import java.time.Duration;
import java.time.LocalDateTime;

public final class CalculadoraCompromisoAtencion {

    private CalculadoraCompromisoAtencion() {}

    public record EvaluacionCompromiso(EstadoSLA estado, double fraccionConsumida, Duration restante) {}

    public static EvaluacionCompromiso evaluar(LocalDateTime inicio, LocalDateTime limite,
                                               LocalDateTime ahora, double umbralRiesgo) {
        long total = Math.max(Duration.between(inicio, limite).toSeconds(), 1);
        long transcurrido = Math.max(Duration.between(inicio, ahora).toSeconds(), 0);
        double fraccion = (double) transcurrido / total;

        EstadoSLA estado = !ahora.isBefore(limite) ? EstadoSLA.VENCIDO
                : fraccion >= umbralRiesgo ? EstadoSLA.POR_VENCER
                : EstadoSLA.DENTRO_TIEMPO;

        Duration restante = Duration.between(ahora, limite);
        return new EvaluacionCompromiso(estado, fraccion, restante);
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/dominio/PoliticaCompromisoAtencion.java", """package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.ConfiguracionSlaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PoliticaCompromisoAtencion {

    static final Map<Prioridad, Integer> MINUTOS_POR_DEFECTO = Map.of(
            Prioridad.CRITICA, 60, Prioridad.ALTA, 120, Prioridad.MEDIA, 480, Prioridad.BAJA, 1440);

    private final ConfiguracionSlaRepository configuracionSlaRepository;

    public LocalDateTime calcularLimite(LocalDateTime inicio, Impacto impacto, Urgencia urgencia, Prioridad prioridad) {
        int minutos = configuracionSlaRepository.findByImpactoAndUrgencia(impacto, urgencia)
                .map(ConfiguracionSLA::getMinutosResolucion)
                .orElseGet(() -> MINUTOS_POR_DEFECTO.getOrDefault(prioridad, 480));
        return inicio.plusMinutes(minutos);
    }

    public static String etiquetaPrioridad(Prioridad p) {
        return switch (p) {
            case CRITICA -> "P1 · Crítica";
            case ALTA -> "P2 · Alta";
            case MEDIA -> "P3 · Media";
            case BAJA -> "P4 · Baja";
        };
    }
}
""")

# 5F. Events & Listeners
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/eventos/CompromisoAtencionCambiadoEvento.java", """package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.*;

import java.time.LocalDateTime;

public record CompromisoAtencionCambiadoEvento(
        Integer idTicket, String asunto, Prioridad prioridad, EstadoSLA estadoAnterior, EstadoSLA estadoNuevo,
        LocalDateTime fechaLimite, String areaNombre, String correoTecnico, String nombreTecnico) {

    public static CompromisoAtencionCambiadoEvento desde(Ticket t, EstadoSLA anterior, EstadoSLA nuevo) {
        Usuario tec = t.getTecnicoAsignado();
        return new CompromisoAtencionCambiadoEvento(t.getIdTicket(), t.getAsunto(), t.getPrioridad(), anterior, nuevo,
                t.getFechaLimiteResolucion(), t.getArea().getNombre(),
                tec == null ? null : tec.getCorreo(), tec == null ? null : tec.getNombreVisible());
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/eventos/TicketCriticoRegistradoEvento.java", """package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.Ticket;

public record TicketCriticoRegistradoEvento(Integer idTicket, String asunto, String areaNombre, String ipOrigen) {
    public static TicketCriticoRegistradoEvento desde(Ticket t) {
        return new TicketCriticoRegistradoEvento(t.getIdTicket(), t.getAsunto(), t.getArea().getNombre(), t.getIpOrigen());
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/aplicacion/ResumenCicloMonitor.java", """package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import java.time.Duration;
import java.time.LocalDateTime;

public record ResumenCicloMonitor(LocalDateTime inicio, Duration duracion, int evaluados,
                                  int pasaronARiesgo, int vencieron, int errores) {}
""")

# 5E. Evaluador & Programador & Controller
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/EvaluadorCompromisosAtencion.java", """package com.hospital.servicedesk.operaciones.compromisos;

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
                .detalle("Fracción consumida: " + String.format(Locale.ROOT, \"%.2f\", evaluacion.fraccionConsumida()))
                .ipOrigen(null)
                .build());

        eventos.publishEvent(CompromisoAtencionCambiadoEvento.desde(t, actual, calculado));
        return calculado == EstadoSLA.VENCIDO ? Resultado.VENCIDO : Resultado.EN_RIESGO;
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/ProgramadorMonitorCompromisos.java", """package com.hospital.servicedesk.operaciones.compromisos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "servicedesk.compromisos.monitor-habilitado", havingValue = "true", matchIfMissing = true)
public class ProgramadorMonitorCompromisos {

    private final EvaluadorCompromisosAtencion evaluador;

    @Scheduled(fixedRateString = "${servicedesk.compromisos.intervalo-ms:60000}",
            initialDelayString = "${servicedesk.compromisos.retraso-inicial-ms:30000}")
    public void programarEvaluacion() {
        try {
            evaluador.ejecutarCiclo();
        } catch (Exception e) {
            log.error("Error en ciclo automático del monitor de compromisos: {}", e.getMessage(), e);
        }
    }
}
""")

# 5F. Notificador
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/notificacion/NotificadorCompromisosAtencion.java", """package com.hospital.servicedesk.operaciones.compromisos.notificacion;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.operaciones.compromisos.config.ConfiguracionTareasSegundoPlano;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.CorreoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificadorCompromisosAtencion {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CorreoService correoService;
    private final UsuarioRepository usuarioRepository;
    private final PropiedadesCompromisoAtencion propiedades;

    @Async(ConfiguracionTareasSegundoPlano.EJECUTOR_NOTIFICACIONES)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alCambiarCompromiso(CompromisoAtencionCambiadoEvento e) {
        boolean vencido = e.estadoNuevo() == EstadoSLA.VENCIDO;
        boolean notificar = e.prioridad() == Prioridad.CRITICA || (e.prioridad() == Prioridad.ALTA && vencido);
        log.info("Compromiso de atención del ticket #{} ({}): {} → {}", e.idTicket(),
                PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()), e.estadoAnterior(), e.estadoNuevo());
        if (!notificar) return;

        Set<String> destinatarios = new LinkedHashSet<>();
        if (e.correoTecnico() != null) destinatarios.add(e.correoTecnico());
        destinatarios.addAll(propiedades.correosSupervision());
        if (e.prioridad() == Prioridad.CRITICA) destinatarios.addAll(correosAdministradores());

        String asunto = (vencido ? "[VENCIDO]" : "[EN RIESGO]") + " Ticket #" + e.idTicket() + " (" + PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()) + ")";
        String contenido = \"\"\"
                <div style=\"font-family:Arial,sans-serif;font-size:14px;color:#333;\">
                  <h3 style=\"color:%s;\">Compromiso de atención: %s</h3>
                  <p><b>Ticket:</b> #%d — %s</p>
                  <p><b>Área:</b> %s</p>
                  <p><b>Técnico asignado:</b> %s</p>
                  <p><b>Límite SLA:</b> %s</p>
                  <p><b>Estado anterior:</b> %s → <b>Nuevo estado:</b> %s</p>
                </div>
                \"\"\".formatted(
                vencido ? "#d9534f" : "#f0ad4e",
                vencido ? "VENCIDO" : "EN RIESGO",
                e.idTicket(),
                e.asunto(),
                e.areaNombre(),
                e.nombreTecnico() != null ? e.nombreTecnico() : "Sin asignar",
                e.fechaLimite() != null ? e.fechaLimite().format(HORA) : "N/D",
                e.estadoAnterior(),
                e.estadoNuevo()
        );

        for (String dest : destinatarios) {
            try {
                correoService.enviarAlerta(dest, asunto, contenido);
            } catch (Exception ex) {
                log.error("No se pudo enviar alerta de SLA al correo {}: {}", dest, ex.getMessage());
            }
        }
    }

    private List<String> correosAdministradores() {
        return usuarioRepository.findAll().stream()
                .filter(u -> "ADMINISTRADOR".equalsIgnoreCase(u.getRol()) && u.getCorreo() != null)
                .map(Usuario::getCorreo)
                .toList();
    }
}
""")

# 5E. Controller
write_file("backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/api/MonitorCompromisosController.java", """package com.hospital.servicedesk.operaciones.compromisos.api;

import com.hospital.servicedesk.operaciones.compromisos.EvaluadorCompromisosAtencion;
import com.hospital.servicedesk.operaciones.compromisos.aplicacion.ResumenCicloMonitor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/compromisos-atencion")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class MonitorCompromisosController {

    private final EvaluadorCompromisosAtencion evaluador;

    @PostMapping("/evaluar")
    public ResponseEntity<ResumenCicloMonitor> evaluarManual() {
        ResumenCicloMonitor resumen = evaluador.ejecutarCiclo();
        return ResponseEntity.ok(resumen);
    }

    @GetMapping("/ultimo-ciclo")
    public ResponseEntity<Object> obtenerUltimoCiclo() {
        return evaluador.ultimoCiclo()
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("mensaje", "Aún no se ha ejecutado ningún ciclo de monitorización.")));
    }
}
""")

# 5G. SQL Migration V1_5
write_file("backend/src/main/resources/db/migraciones/V1_5__auditoria_y_compromisos.sql", """-- =============================================================================
-- Migración V1_5: Auditoría ampliada y Monitor de Compromisos de Atención (SLA)
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Ampliación de historial_ticket (Fase 0/5) ----------------------------------
IF COL_LENGTH('dbo.historial_ticket', 'estado_anterior') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_anterior VARCHAR(30) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'estado_nuevo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_nuevo VARCHAR(30) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'motivo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD motivo NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'ip_origen') IS NULL
    ALTER TABLE dbo.historial_ticket ADD ip_origen VARCHAR(45) NULL;

-- 2. Normalización de estado_sla en tickets activos ----------------------------
UPDATE dbo.ticket
SET estado_sla = 'DENTRO_TIEMPO'
WHERE estado_sla IS NULL AND estado IN ('ABIERTO', 'EN_PROGRESO', 'ESCALADO');

-- 3. Índices optimizados para el monitor ---------------------------------------
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ticket_monitor_sla' AND object_id = OBJECT_ID('dbo.ticket'))
    CREATE NONCLUSTERED INDEX IX_ticket_monitor_sla
    ON dbo.ticket (estado, fecha_limite_resolucion)
    INCLUDE (estado_sla, fecha_creacion);

COMMIT TRANSACTION;
""")

print("Phase 5 files generated successfully.")
