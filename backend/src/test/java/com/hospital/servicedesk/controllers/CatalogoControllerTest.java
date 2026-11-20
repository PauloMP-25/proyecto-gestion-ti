package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.OpcionCatalogoRespuesta;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.services.CatalogoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CatalogoControllerTest {

    @Mock
    private CatalogoService catalogoService;

    @InjectMocks
    private CatalogoController catalogoController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetGradosProfesionalesDevuelveListaCompleta() {
        List<OpcionCatalogoRespuesta> opciones = Arrays.stream(GradoProfesional.values())
                .map(g -> new OpcionCatalogoRespuesta(g.name(), g.getPrefijo(), g.getDescripcion(), g.ordinal() + 1))
                .toList();

        when(catalogoService.getGradosProfesionales()).thenReturn(opciones);

        ResponseEntity<List<OpcionCatalogoRespuesta>> respuesta = catalogoController.getGradosProfesionales();

        assertNotNull(respuesta);
        assertEquals(200, respuesta.getStatusCode().value());
        assertNotNull(respuesta.getBody());
        assertEquals(7, respuesta.getBody().size());
        assertEquals("LIC", respuesta.getBody().get(0).codigo());
        assertEquals("SIN_GRADO", respuesta.getBody().get(6).codigo());
    }
}
