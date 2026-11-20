package com.hospital.servicedesk.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GradoProfesionalTest {

    @Test
    void testFormatearConGradoLicenciado() {
        String resultado = GradoProfesional.LIC.formatear("Patricia", "Ramos");
        assertEquals("Lic. Patricia Ramos", resultado);
    }

    @Test
    void testFormatearConGradoDoctor() {
        String resultado = GradoProfesional.DR.formatear("Carlos", "Gómez");
        assertEquals("Dr. Carlos Gómez", resultado);
    }

    @Test
    void testFormatearConGradoDoctora() {
        String resultado = GradoProfesional.DRA.formatear("Elena", "Navarro");
        assertEquals("Dra. Elena Navarro", resultado);
    }

    @Test
    void testFormatearConGradoTecnico() {
        String resultado = GradoProfesional.TEC.formatear("Manuel", "Quispe");
        assertEquals("Téc. Manuel Quispe", resultado);
    }

    @Test
    void testFormatearConGradoIngeniero() {
        String resultado = GradoProfesional.ING.formatear("Roberto", "Silva");
        assertEquals("Ing. Roberto Silva", resultado);
    }

    @Test
    void testFormatearConGradoMagister() {
        String resultado = GradoProfesional.MG.formatear("Ana", "Torres");
        assertEquals("Mg. Ana Torres", resultado);
    }

    @Test
    void testFormatearSinGrado() {
        String resultado = GradoProfesional.SIN_GRADO.formatear("Rosa", "Medina");
        assertEquals("Rosa Medina", resultado);
    }

    @Test
    void testUsuarioGetNombreVisible() {
        Usuario usuario = Usuario.builder()
                .gradoProfesional(GradoProfesional.LIC)
                .nombres("Rosa")
                .apellidos("Flores")
                .build();

        assertEquals("Lic. Rosa Flores", usuario.getNombreVisible());

        Usuario sinGrado = Usuario.builder()
                .nombres("Juan")
                .apellidos("Pérez")
                .build();

        assertEquals("Juan Pérez", sinGrado.getNombreVisible());
    }
}
