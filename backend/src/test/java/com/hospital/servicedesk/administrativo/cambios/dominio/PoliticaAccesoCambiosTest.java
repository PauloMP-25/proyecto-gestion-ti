package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.*;

class PoliticaAccesoCambiosTest {

    private final PoliticaAccesoCambios politica = new PoliticaAccesoCambios();

    @Test
    void solicitantePuedeEditarSuBorrador() {
        Usuario solicitante = Usuario.builder().idUsuario(1).correo("user@hsmsi.gob.pe").build();
        SolicitudCambio solicitud = SolicitudCambio.builder().solicitante(solicitante).estado(EstadoCambio.BORRADOR).build();

        ContextoActor ctx = new ContextoActor("user@hsmsi.gob.pe", "USUARIO_FINAL", "127.0.0.1");
        assertThatCode(() -> politica.verificarEdicion(solicitud, solicitante, ctx))
                .doesNotThrowAnyException();
    }

    @Test
    void solicitanteNoPuedeEvaluarSuPropiaSolicitudSegregacionFunciones() {
        Usuario solicitante = Usuario.builder().idUsuario(1).correo("admin.solicitante@hsmsi.gob.pe").build();
        SolicitudCambio solicitud = SolicitudCambio.builder().solicitante(solicitante).estado(EstadoCambio.EN_EVALUACION).build();

        ContextoActor ctx = new ContextoActor("admin.solicitante@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> politica.verificarTransicion(AccionCambio.APROBAR, solicitud, solicitante, ctx))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Quien registró la solicitud no puede evaluarla");
    }
}
