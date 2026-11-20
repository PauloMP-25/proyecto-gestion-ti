package com.hospital.servicedesk.administrativo.equipos.aplicacion;

import com.hospital.servicedesk.administrativo.equipos.dto.DisponibilidadIpRespuesta;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.Usuario;

import java.util.Optional;

/**
 * Servicio especializado en el ciclo de vida, asignación y liberación de direccionamiento IP estático.
 */
public interface AsignacionIpService {

    void asignarIpAEquipo(ElementoConfiguracion equipo, String ipEstatica, Usuario usuarioOperador);

    void liberarIpDeEquipo(ElementoConfiguracion equipo, Usuario usuarioOperador);

    DisponibilidadIpRespuesta verificarDisponibilidad(String ip, Integer idEquipoExcluir);

    Optional<String> obtenerIpVigente(Integer idCi);
}
