package com.hospital.servicedesk.asistencial.atencion.aplicacion.impl;

import com.hospital.servicedesk.asistencial.atencion.aplicacion.ContextoAtencionService;
import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dominio.objetivo.ObjetivoEquipoActual;
import com.hospital.servicedesk.asistencial.atencion.dominio.objetivo.ObjetivoImpresoraArea;
import com.hospital.servicedesk.asistencial.atencion.dominio.objetivo.ObjetivoOtro;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.AreaContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.EquipoContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialTicketRepository;
import com.hospital.servicedesk.repositories.TicketRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportarProblemaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private ElementoConfiguracionRepository elementoRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private HistorialTicketRepository historialTicketRepository;

    @Mock
    private ContextoAtencionService contextoAtencionService;

    private Clock clock;
    private ReportarProblemaServiceImpl service;

    private Usuario patricia;
    private Area admision;
    private ElementoConfiguracion pcAdmision;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-11-20T10:00:00Z"), ZoneId.of("UTC"));
        service = new ReportarProblemaServiceImpl(
                usuarioRepository,
                areaRepository,
                elementoRepository,
                ticketRepository,
                historialTicketRepository,
                contextoAtencionService,
                List.of(new ObjetivoEquipoActual(), new ObjetivoImpresoraArea(), new ObjetivoOtro()),
                clock
        );

        admision = Area.builder().idArea(1).nombre("Admisión").activo(true).build();
        pcAdmision = ElementoConfiguracion.builder().idCi(10).codigoInventario("PC-ADM-02").area(admision).build();
        patricia = Usuario.builder()
                .idUsuario(5)
                .correo("pramos@hsmsi.gob.pe")
                .nombres("Patricia")
                .apellidos("Ramos")
                .gradoProfesional(GradoProfesional.LIC)
                .area(admision)
                .build();
    }

    @Test
    @DisplayName("Debe registrar ticket contextual con área, equipo detectado y auditoría fidedigna")
    void debeRegistrarTicketContextual() {
        ReportarProblemaSolicitud solicitud = new ReportarProblemaSolicitud(
                TipoTicket.INCIDENTE,
                "Sistema de citas lento",
                "El aplicativo demora en cargar historias",
                Impacto.ALTO,
                Urgencia.ALTA,
                ObjetivoFalla.EQUIPO_ACTUAL,
                null,
                null
        );

        when(usuarioRepository.findByCorreo("pramos@hsmsi.gob.pe")).thenReturn(Optional.of(patricia));

        EquipoContextoRespuesta eqCtx = new EquipoContextoRespuesta(10, "PC-ADM-02", "Computadora Admisión 2", TipoCI.COMPUTADORA, "Ventanilla 2");
        AreaContextoRespuesta areaCtx = new AreaContextoRespuesta(1, "Admisión", "Primer Piso", "Frente Estadística", "105", null);
        ContextoAtencionRespuesta ctx = new ContextoAtencionRespuesta(
                EstadoDeteccion.DETECTADO, "192.168.10.12", eqCtx, areaCtx, List.of(), null, false
        );

        when(contextoAtencionService.resolver("192.168.10.12", patricia)).thenReturn(ctx);
        when(elementoRepository.findById(10)).thenReturn(Optional.of(pcAdmision));
        when(areaRepository.findById(1)).thenReturn(Optional.of(admision));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket t = invocation.getArgument(0);
            t.setIdTicket(999);
            return t;
        });

        Ticket creado = service.reportar(solicitud, "pramos@hsmsi.gob.pe", "192.168.10.12");

        assertThat(creado).isNotNull();
        assertThat(creado.getPrioridad()).isEqualTo(Prioridad.CRITICA);
        assertThat(creado.getArea().getNombre()).isEqualTo("Admisión");
        assertThat(creado.getElementoConfiguracion().getCodigoInventario()).isEqualTo("PC-ADM-02");
        assertThat(creado.getIpOrigen()).isEqualTo("192.168.10.12");

        ArgumentCaptor<HistorialTicket> captor = ArgumentCaptor.forClass(HistorialTicket.builder().getClass().getDeclaringClass() != null ? HistorialTicket.class : HistorialTicket.class);
        verify(historialTicketRepository).save(captor.capture());

        HistorialTicket audit = captor.getValue();
        assertThat(audit.getDetalle()).contains("Reportado por Lic. Patricia Ramos desde PC-ADM-02 (Admisión)");
    }
}
