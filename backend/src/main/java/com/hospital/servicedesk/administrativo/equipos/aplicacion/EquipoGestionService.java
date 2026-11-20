package com.hospital.servicedesk.administrativo.equipos.aplicacion;

import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoSolicitud;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.Usuario;

/**
 * Puerto de gestión y mutaciones sobre equipos hospitalarios.
 */
public interface EquipoGestionService {

    EquipoDetalle crear(EquipoSolicitud solicitud, Usuario usuarioOperador);

    EquipoDetalle actualizar(Integer id, EquipoSolicitud solicitud, Usuario usuarioOperador);

    EquipoDetalle cambiarEstado(Integer id, EstadoCI estado, Usuario usuarioOperador);

    EquipoDetalle asignarIp(Integer id, String ipEstatica, Usuario usuarioOperador);

    EquipoDetalle liberarIp(Integer id, Usuario usuarioOperador);
}
