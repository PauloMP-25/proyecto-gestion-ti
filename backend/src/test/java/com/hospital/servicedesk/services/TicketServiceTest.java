package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.impl.TicketServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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

    @InjectMocks
    private TicketServiceImpl ticketService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
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
