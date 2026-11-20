package com.hospital.servicedesk.asistencial.atencion.aplicacion;

import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.entities.Ticket;

/**
 * Puerto de aplicación para el registro de solicitudes de soporte
 * con resolución de contexto y objetivo de falla asistencial.
 */
public interface ReportarProblemaService {

    /**
     * Registra un nuevo ticket de soporte resolviendo el contexto físico a partir de la IP
     * y asociando la auditoría inmutable del colaborador reportante.
     *
     * @param solicitud Datos del formulario contextual
     * @param correoUsuario Correo del usuario autenticado en la sesión JWT
     * @param ipOrigen Dirección IP limpia de origen TCP
     * @return Entidad Ticket creada y persistida
     */
    Ticket reportar(ReportarProblemaSolicitud solicitud, String correoUsuario, String ipOrigen);
}
