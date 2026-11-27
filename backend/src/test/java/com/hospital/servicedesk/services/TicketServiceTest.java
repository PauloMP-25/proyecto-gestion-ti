package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.impl.TicketServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import org.springframework.context.ApplicationEventPublisher;
import java.time.Clock;
import java.time.LocalDateTime;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private HistorialAsignacionIpRepository ipRepo;

    @Mock
    private HistorialTicketRepository auditRepo;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PoliticaCompromisoAtencion politicaCompromiso;

    @Mock
    private Clock clock;

    @Mock
    private AuditoriaTicketService auditoriaTicketService;

    @Mock
    private ApplicationEventPublisher eventos;


    @InjectMocks
    private TicketServiceImpl ticketService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(clock.instant()).thenReturn(java.time.Instant.now());
        when(clock.getZone()).thenReturn(java.time.ZoneId.systemDefault());
        when(politicaCompromiso.calcularLimite(any(), any(), any(), any())).thenReturn(LocalDateTime.now().plusHours(2));

    }

    @Test
    void testCreateTicketWithUnmatchedIpAppliesFallback() {
        CreateTicketRequest request = CreateTicketRequest.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Impresora sin tóner")
                .descripcion("La impresora del piso 2 no imprime")
                .impacto(Impacto.BAJO)
                .urgencia(Urgencia.BAJA)
                .build();

        when(ipRepo.findActiveAssignmentByIp("10.0.0.99")).thenReturn(Optional.empty());
        when(areaRepository.findAll()).thenReturn(List.of(Area.builder().idArea(1).nombre("Soporte General").build()));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> {
            Ticket t = inv.getArgument(0);
            t.setIdTicket(100);
            return t;
        });

        TicketResponse response = ticketService.createTicket(request, "10.0.0.99");

        assertNotNull(response);
        assertEquals(100, response.getIdTicket());
        assertEquals("Soporte General", response.getAreaNombre());
        assertEquals("BAJA", response.getPrioridad());
    }

    private static class List {
        static <T> java.util.List<T> of(T... items) {
            return java.util.List.of(items);
        }
    }
}
