package com.hospital.servicedesk.asistencial.atencion.dominio.objetivo;

import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.springframework.stereotype.Component;

@Component
public class ObjetivoEquipoActual implements ResolutorObjetivoFalla {

    @Override
    public Integer resolverEquipoAfectado(ReportarProblemaSolicitud solicitud, ContextoAtencionRespuesta ctx) {
        if (ctx == null || ctx.estadoDeteccion() != EstadoDeteccion.DETECTADO || ctx.equipo() == null) {
            throw new ReglaNegocioException("objetivo",
                    "No se detectó la computadora de origen; elija «Otro equipo» o seleccione un área manualmente");
        }
        return ctx.equipo().id();
    }

    @Override
    public ObjetivoFalla getObjetivo() {
        return ObjetivoFalla.EQUIPO_ACTUAL;
    }
}
