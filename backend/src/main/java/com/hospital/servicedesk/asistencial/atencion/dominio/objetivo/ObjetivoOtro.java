package com.hospital.servicedesk.asistencial.atencion.dominio.objetivo;

import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import org.springframework.stereotype.Component;

@Component
public class ObjetivoOtro implements ResolutorObjetivoFalla {

    @Override
    public Integer resolverEquipoAfectado(ReportarProblemaSolicitud solicitud, ContextoAtencionRespuesta ctx) {
        return null;
    }

    @Override
    public ObjetivoFalla getObjetivo() {
        return ObjetivoFalla.OTRO;
    }
}
