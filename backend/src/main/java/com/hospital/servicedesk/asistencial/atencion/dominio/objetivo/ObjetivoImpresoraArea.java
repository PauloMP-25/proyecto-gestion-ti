package com.hospital.servicedesk.asistencial.atencion.dominio.objetivo;

import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.ImpresoraAreaRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.springframework.stereotype.Component;

@Component
public class ObjetivoImpresoraArea implements ResolutorObjetivoFalla {

    @Override
    public Integer resolverEquipoAfectado(ReportarProblemaSolicitud solicitud, ContextoAtencionRespuesta ctx) {
        if (solicitud.idImpresora() == null) {
            throw new ReglaNegocioException("idImpresora", "Debe seleccionar una impresora del área");
        }

        if (ctx == null || ctx.impresorasArea() == null || ctx.impresorasArea().isEmpty()) {
            throw new ReglaNegocioException("idImpresora", "No existen impresoras de red registradas en el área actual");
        }

        boolean perteneceAlArea = ctx.impresorasArea().stream()
                .map(ImpresoraAreaRespuesta::id)
                .anyMatch(id -> id.equals(solicitud.idImpresora()));

        if (!perteneceAlArea) {
            throw new ReglaNegocioException("idImpresora",
                    "La impresora seleccionada no pertenece al área detectada");
        }

        return solicitud.idImpresora();
    }

    @Override
    public ObjetivoFalla getObjetivo() {
        return ObjetivoFalla.IMPRESORA_AREA;
    }
}
