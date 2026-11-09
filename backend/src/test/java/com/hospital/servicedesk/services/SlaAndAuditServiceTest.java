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
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SlaAndAuditServiceTest {

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
    void testSlaPriorityCalculationCritical() {
        CreateTicketRequest request = CreateTicketRequest.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Caída del Servidor Principal")
                .descripcion("El sistema HIS no responde")
                .impacto(Impacto.ALTO)
                .urgencia(Urgencia.ALTA)
                .build();

        when(ipRepo.findActiveAssignmentByIp(anyString())).thenReturn(Optional.empty());
        when(areaRepository.findAll()).thenReturn(List.of(Area.builder().idArea(1).nombre("TI").build()));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(inv -> {
            Ticket t = inv.getArgument(0);
            t.setIdTicket(10);
            return t;
        });

        TicketResponse response = ticketService.createTicket(request, "192.168.1.10");

        assertNotNull(response);
        assertEquals("CRITICA", response.getPrioridad());
        assertNotNull(response.getFechaLimiteResolucion());
    }

    @Test
    void testAuditRecordOnAssignment() {
        Ticket existingTicket = Ticket.builder()
                .idTicket(5)
                .asunto("Falla de impresora")
                .estado(EstadoTicket.ABIERTO)
                .build();

        Usuario tecnico = Usuario.builder()
                .idUsuario(2)
                .nombres("Carlos")
                .apellidos("Pérez")
                .correo("carlos@hospital.com")
                .build();

        when(ticketRepository.findById(5)).thenReturn(Optional.of(existingTicket));
        when(usuarioRepository.findById(2)).thenReturn(Optional.of(tecnico));
        when(usuarioRepository.findByCorreo("admin@hospital.com")).thenReturn(Optional.of(
                Usuario.builder().idUsuario(1).nombres("Admin").apellidos("Root").correo("admin@hospital.com").build()
        ));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(existingTicket);

        TicketResponse response = ticketService.assignTicket(5, 2, "admin@hospital.com");

        assertNotNull(response);
        assertEquals("EN_PROGRESO", response.getEstado());
        verify(auditRepo, times(1)).save(any(HistorialTicket.class));
    }

    @Test
    void testTicketNotFoundThrowsException() {
        when(ticketRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> {
            ticketService.getTicketById(999);
        });
    }

    private static class List {
        static <T> java.util.List<T> of(T... items) {
            return java.util.List.of(items);
        }
    }
}
