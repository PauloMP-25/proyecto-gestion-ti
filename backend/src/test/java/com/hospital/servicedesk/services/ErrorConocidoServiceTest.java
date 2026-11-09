package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.ErrorConocidoDTOs.*;
import com.hospital.servicedesk.entities.ErrorConocido;
import com.hospital.servicedesk.repositories.ErrorConocidoRepository;
import com.hospital.servicedesk.services.impl.ErrorConocidoServiceImpl;
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

class ErrorConocidoServiceTest {

    @Mock
    private ErrorConocidoRepository repo;

    @InjectMocks
    private ErrorConocidoServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCreateErrorConocidoSuccess() {
        ErrorConocidoRequest request = ErrorConocidoRequest.builder()
                .titulo("Error de Impresora HP LaserJet")
                .descripcionProblema("Atasco de papel constante en bandeja 2")
                .solucionTrabajo("Limpiar rodillos de alimentación y reiniciar spooler")
                .publicado(true)
                .build();

        when(repo.save(any(ErrorConocido.class))).thenAnswer(inv -> {
            ErrorConocido e = inv.getArgument(0);
            e.setIdError(1);
            e.setFechaCreacion(LocalDateTime.now());
            return e;
        });

        ErrorConocidoResponse response = service.createError(request);

        assertNotNull(response);
        assertEquals(1, response.getIdError());
        assertEquals("Error de Impresora HP LaserJet", response.getTitulo());
        assertTrue(response.getPublicado());
    }

    @Test
    void testGetErrorConocidoNotFound() {
        when(repo.findById(99)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> {
            service.getErrorById(99);
        });
    }

    @Test
    void testDeleteErrorConocidoSuccess() {
        ErrorConocido error = ErrorConocido.builder().idError(1).titulo("Test").build();
        when(repo.findById(1)).thenReturn(Optional.of(error));
        doNothing().when(repo).delete(error);

        assertDoesNotThrow(() -> service.deleteError(1));
        verify(repo, times(1)).delete(error);
    }
}
