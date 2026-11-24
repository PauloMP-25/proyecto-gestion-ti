package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.EnumSet;
import java.util.Set;

import static com.hospital.servicedesk.entities.EstadoCambio.*;

@Getter
public enum AccionCambio {
    ENVIAR_EVALUACION(EnumSet.of(BORRADOR), EN_EVALUACION, false, "enviar a evaluación"),
    APROBAR(EnumSet.of(EN_EVALUACION), APROBADO, false, "aprobar"),
    RECHAZAR(EnumSet.of(EN_EVALUACION), RECHAZADO, true, "rechazar"),
    DEVOLVER_BORRADOR(EnumSet.of(EN_EVALUACION), BORRADOR, true, "devolver a borrador"),
    INICIAR_EJECUCION(EnumSet.of(APROBADO), EN_EJECUCION, false, "iniciar ejecución"),
    MARCAR_IMPLEMENTADO(EnumSet.of(EN_EJECUCION), IMPLEMENTADO, false, "marcar como implementado"),
    CANCELAR(EnumSet.of(BORRADOR, EN_EVALUACION, APROBADO), CANCELADO, true, "cancelar solicitud");

    private final Set<EstadoCambio> origenes;
    private final EstadoCambio destino;
    private final boolean requiereObservacion;
    private final String verbo;

    AccionCambio(Set<EstadoCambio> origenes, EstadoCambio destino, boolean requiereObservacion, String verbo) {
        this.origenes = origenes;
        this.destino = destino;
        this.requiereObservacion = requiereObservacion;
        this.verbo = verbo;
    }

    public boolean permiteDesde(EstadoCambio estado) { return origenes.contains(estado); }
}
