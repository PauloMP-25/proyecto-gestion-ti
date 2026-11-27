package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.SolicitudCambioFormulario;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

@Component
public class ValidadorSolicitudCambio {

    private final Clock clock;

    public ValidadorSolicitudCambio(Clock clock) {
        this.clock = clock;
    }

    public static boolean esAreaCritica(Area a) {
        return a.getPrioridadDefecto() != null && "P1".equalsIgnoreCase(a.getPrioridadDefecto());
    }

    public void validar(SolicitudCambioFormulario f) {
        LocalDateTime ahora = LocalDateTime.now(clock);

        if (f.horario() != null) {
            if (f.horario().inicioIso().isBefore(ahora)) {
                throw new ReglaNegocioException("horario", "La fecha de inicio programada no puede estar en el pasado.");
            }
            if (f.horario().finIso().isBefore(f.horario().inicioIso())) {
                throw new ReglaNegocioException("horario", "La fecha de fin programada debe ser posterior al inicio.");
            }
        }

        if (f.evaluacion().nivel().exigeContinuidad() && (f.planReversa().planContinuidad() == null || f.planReversa().planContinuidad().isBlank())) {
            throw new ReglaNegocioException("planContinuidad", "Los cambios con impacto alto o crítico exigen un plan de continuidad asistencial.");
        }
    }
}
