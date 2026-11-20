package com.hospital.servicedesk.asistencial.atencion.dominio.objetivo;

import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;

/**
 * Contrato de estrategia (Strategy Pattern - OCP) para resolver el equipo afectado
 * según el foco u objetivo del problema seleccionado por el usuario.
 */
public interface ResolutorObjetivoFalla {

    /**
     * Resuelve y valida el identificador del equipo hospitalario afectado.
     *
     * @param solicitud Solicitud de reporte enviada por el usuario
     * @param ctx Contexto asistencial y de red detectado
     * @return Identificador del equipo (idCi) o null si no aplica equipo específico
     */
    Integer resolverEquipoAfectado(ReportarProblemaSolicitud solicitud, ContextoAtencionRespuesta ctx);

    ObjetivoFalla getObjetivo();
}
