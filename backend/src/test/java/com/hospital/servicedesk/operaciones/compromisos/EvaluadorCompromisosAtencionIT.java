package com.hospital.servicedesk.operaciones.compromisos;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RecordApplicationEvents
@Transactional
class EvaluadorCompromisosAtencionIT {

    @Autowired
    private EvaluadorCompromisosAtencion evaluador;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private AreaRepository areaRepository;

    @Autowired
    private ApplicationEvents applicationEvents;

    private Area areaTest;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        areaTest = areaRepository.findAll().stream().findFirst().orElseGet(() ->
                areaRepository.save(Area.builder().nombre("Área Test Monitor").piso("Piso 1").activo(true).build())
        );
    }

    @Test
    void transicionDeEstadosSlaYDeteccion() {
        LocalDateTime ahora = LocalDateTime.of(2026, 11, 26, 12, 0);

        // Ticket dentro de tiempo (creado hace poco)
        Ticket t1 = ticketRepository.save(Ticket.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Ticket dentro de tiempo")
                .descripcion("Descripción test")
                .impacto(Impacto.BAJO)
                .urgencia(Urgencia.BAJA)
                .prioridad(Prioridad.BAJA)
                .estado(EstadoTicket.ABIERTO)
                .area(areaTest)
                .fechaCreacion(ahora.minusMinutes(10))
                .fechaLimiteResolucion(ahora.plusMinutes(50))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build());

        // Ticket en riesgo (> 70% del plazo consumido)
        Ticket t2 = ticketRepository.save(Ticket.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Ticket en riesgo")
                .descripcion("Descripción test")
                .impacto(Impacto.MEDIO)
                .urgencia(Urgencia.MEDIA)
                .prioridad(Prioridad.MEDIA)
                .estado(EstadoTicket.ABIERTO)
                .area(areaTest)
                .fechaCreacion(ahora.minusMinutes(80))
                .fechaLimiteResolucion(ahora.plusMinutes(20))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build());

        // Ticket vencido (pasado del límite)
        Ticket t3 = ticketRepository.save(Ticket.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Ticket vencido")
                .descripcion("Descripción test")
                .impacto(Impacto.ALTO)
                .urgencia(Urgencia.ALTA)
                .prioridad(Prioridad.CRITICA)
                .estado(EstadoTicket.ABIERTO)
                .area(areaTest)
                .fechaCreacion(ahora.minusMinutes(120))
                .fechaLimiteResolucion(ahora.minusMinutes(10))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build());

        var resumen = evaluador.ejecutarCiclo();
        assertThat(resumen.evaluados()).isGreaterThanOrEqualTo(3);

        Ticket actualizadoT2 = ticketRepository.findById(t2.getIdTicket()).orElseThrow();
        Ticket actualizadoT3 = ticketRepository.findById(t3.getIdTicket()).orElseThrow();

        assertThat(actualizadoT2.getEstadoSla()).isEqualTo(EstadoSLA.POR_VENCER);
        assertThat(actualizadoT3.getEstadoSla()).isEqualTo(EstadoSLA.VENCIDO);

        long eventosCambio = applicationEvents.stream(CompromisoAtencionCambiadoEvento.class).count();
        assertThat(eventosCambio).isGreaterThanOrEqualTo(2);
    }

    @Test
    void idempotenciaSegundoCiclo() {
        LocalDateTime ahora = LocalDateTime.of(2026, 11, 26, 12, 0);

        ticketRepository.save(Ticket.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Ticket vencido idéntico")
                .descripcion("Test")
                .impacto(Impacto.ALTO)
                .urgencia(Urgencia.ALTA)
                .prioridad(Prioridad.CRITICA)
                .estado(EstadoTicket.ABIERTO)
                .area(areaTest)
                .fechaCreacion(ahora.minusMinutes(120))
                .fechaLimiteResolucion(ahora.minusMinutes(10))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build());

        evaluador.ejecutarCiclo();
        long eventosPrimerCiclo = applicationEvents.stream(CompromisoAtencionCambiadoEvento.class).count();

        // Segundo ciclo idéntico
        evaluador.ejecutarCiclo();
        long eventosSegundoCiclo = applicationEvents.stream(CompromisoAtencionCambiadoEvento.class).count();

        // No debe haber nuevos eventos publicados en el segundo ciclo (idempotencia)
        assertThat(eventosSegundoCiclo).isEqualTo(eventosPrimerCiclo);
    }
}
