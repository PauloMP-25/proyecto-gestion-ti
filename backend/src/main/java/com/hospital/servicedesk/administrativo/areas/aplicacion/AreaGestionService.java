package com.hospital.servicedesk.administrativo.areas.aplicacion;

import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaSolicitud;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.compartido.web.RespuestaConAdvertencias;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioResumen;
import com.hospital.servicedesk.entities.TipoCI;

import java.util.List;

/**
 * Puerto de gestión (Command / Mutation Service) para áreas hospitalarias.
 */
public interface AreaGestionService {

    AreaDetalle crear(AreaSolicitud solicitud);

    RespuestaConAdvertencias<AreaDetalle> actualizar(Integer id, AreaSolicitud solicitud);

    AreaDetalle cambiarEstado(Integer id, boolean activo);

    UsuarioResumen reasignarPersonal(Integer idArea, Integer idUsuario);

    List<UsuarioResumen> listarPersonal(Integer idArea, boolean incluirInactivos);

    List<EquipoResumen> listarEquipos(Integer idArea, TipoCI tipo);
    void eliminar(Integer id);
}
