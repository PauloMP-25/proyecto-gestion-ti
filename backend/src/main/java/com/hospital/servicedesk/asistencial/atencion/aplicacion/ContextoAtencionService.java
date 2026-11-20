package com.hospital.servicedesk.asistencial.atencion.aplicacion;

import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.entities.Usuario;

/**
 * Puerto de autodetección y resolución del contexto asistencial del usuario reportante.
 */
public interface ContextoAtencionService {

    /**
     * Resuelve el equipo de origen, área hospitalaria e impresoras disponibles
     * a partir de la IP estática detectada en la conexión TCP y la sesión del usuario.
     *
     * @param ipOrigen Dirección IP limpia resuelta por ResolutorIpCliente
     * @param usuarioAutenticado Usuario reportante autenticado (desde el JWT)
     * @return DTO inmutable con el contexto resuelto
     */
    ContextoAtencionRespuesta resolver(String ipOrigen, Usuario usuarioAutenticado);
}
