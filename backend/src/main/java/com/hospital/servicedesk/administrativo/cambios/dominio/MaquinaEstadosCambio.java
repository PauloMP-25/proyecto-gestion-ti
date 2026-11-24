package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class MaquinaEstadosCambio {

    public List<AccionCambio> accionesPermitidas(EstadoCambio estadoActual, ContextoActor ctx) {
        return Arrays.stream(AccionCambio.values())
                .filter(a -> a.permiteDesde(estadoActual))
                .filter(a -> puedeEjecutar(a, ctx))
                .toList();
    }

    public void validarTransicion(AccionCambio accion, EstadoCambio estadoActual, String observacion, ContextoActor ctx) {
        if (!accion.permiteDesde(estadoActual)) {
            throw new ConflictoNegocioException("La acción '" + accion.getVerbo() + "' no está permitida para el estado actual (" + estadoActual.getEtiqueta() + ").");
        }
        if (!puedeEjecutar(accion, ctx)) {
            throw new ConflictoNegocioException("No tiene permisos para ejecutar la acción '" + accion.getVerbo() + "'.");
        }
        if (accion.isRequiereObservacion() && (observacion == null || observacion.isBlank())) {
            throw new ConflictoNegocioException("observacion", "La acción '" + accion.getVerbo() + "' requiere una observación o motivo obligatorio.");
        }
    }

    private boolean puedeEjecutar(AccionCambio accion, ContextoActor ctx) {
        return switch (accion) {
            case ENVIAR_EVALUACION, CANCELAR -> ctx.esAdministrador() || ctx.esTecnico() || ctx.esPracticante();
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> ctx.esAdministrador();
            case INICIAR_EJECUCION, MARCAR_IMPLEMENTADO -> ctx.esPersonalTecnico();
        };
    }
}
