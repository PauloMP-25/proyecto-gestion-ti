package com.hospital.servicedesk.mappers;

import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.entities.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {}

    public static UsuarioRespuesta toResponse(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        String nombreCompleto = ((usuario.getNombres() != null ? usuario.getNombres() : "") + " " +
                                (usuario.getApellidos() != null ? usuario.getApellidos() : "")).trim();

        Integer idArea = usuario.getArea() != null ? usuario.getArea().getIdArea() : null;
        String areaNombre = usuario.getArea() != null ? usuario.getArea().getNombre() : null;

        return new UsuarioRespuesta(
            usuario.getIdUsuario(),
            usuario.getNombres(),
            usuario.getApellidos(),
            nombreCompleto,
            usuario.getCorreo(),
            usuario.getRol(),
            usuario.getNivelSoporte(),
            idArea,
            areaNombre,
            usuario.getActivo(),
            usuario.getFechaCreacion()
        );
    }
}
