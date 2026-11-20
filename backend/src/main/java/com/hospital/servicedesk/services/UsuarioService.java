package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioActualizarRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRegistroRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;

import java.util.List;

/**
 * Contrato de servicio para la gestión de usuarios y personal.
 * Desacoplado de la persistencia mediante DTOs inmutables y paginación.
 */
public interface UsuarioService {
    List<UsuarioRespuesta> getTecnicosActivos();
    List<UsuarioRespuesta> getAllUsuarios();
    PaginaRespuesta<UsuarioRespuesta> getUsuariosPaginados(int pagina, int tamano, String busqueda);
    UsuarioRespuesta createUsuario(UsuarioRegistroRequest request);
    UsuarioRespuesta updateUsuario(Integer id, UsuarioActualizarRequest request);
    UsuarioRespuesta toggleActivo(Integer id);
    void cambiarContrasena(String email, String actual, String nuevaContrasena);
}
