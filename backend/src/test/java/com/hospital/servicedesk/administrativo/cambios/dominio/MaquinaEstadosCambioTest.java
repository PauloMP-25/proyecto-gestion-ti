package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class MaquinaEstadosCambioTest {

    private final MaquinaEstadosCambio maquina = new MaquinaEstadosCambio();

    @Test
    void accionesPermitidasDesdeBorradorParaTecnico() {
        ContextoActor ctx = new ContextoActor("tec@hsmsi.gob.pe", "TECNICO", "127.0.0.1");
        var acciones = maquina.accionesPermitidas(EstadoCambio.BORRADOR, ctx);
        assertThat(acciones).contains(AccionCambio.ENVIAR_EVALUACION, AccionCambio.CANCELAR);
    }

    @Test
    void transicionValidaPasaSinExcepcion() {
        ContextoActor ctx = new ContextoActor("tec@hsmsi.gob.pe", "TECNICO", "127.0.0.1");
        assertThatCode(() -> maquina.validarTransicion(AccionCambio.ENVIAR_EVALUACION, EstadoCambio.BORRADOR, null, ctx))
                .doesNotThrowAnyException();
    }

    @Test
    void transicionInvalidaLanzaConflicto() {
        ContextoActor ctx = new ContextoActor("admin@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> maquina.validarTransicion(AccionCambio.APROBAR, EstadoCambio.BORRADOR, null, ctx))
                .isInstanceOf(ConflictoNegocioException.class);
    }

    @Test
    void accionRequiereObservacionLanzaExcepcionSiFalta() {
        ContextoActor ctx = new ContextoActor("admin@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> maquina.validarTransicion(AccionCambio.RECHAZAR, EstadoCambio.EN_EVALUACION, "   ", ctx))
                .isInstanceOf(ConflictoNegocioException.class);
    }
}
