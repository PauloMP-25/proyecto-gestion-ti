package com.hospital.servicedesk.mappers;

import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.entities.Usuario;

public final class UsuarioMapper {

    private UsuarioMapper() {}

    public static UsuarioRespuesta toResponse(Usuario usuario) {
        return toResponse(usuario, null);
    }

    public static UsuarioRespuesta toResponse(Usuario usuario, String contrasenaTemporal) {
        if (usuario == null) {
            return null;
        }

        String nombreCompleto = ((usuario.getNombres() != null ? usuario.getNombres() : "") + " " +
                                (usuario.getApellidos() != null ? usuario.getApellidos() : "")).trim();

        Integer idArea = usuario.getArea() != null ? usuario.getArea().getIdArea() : null;
        String areaNombre = usuario.getArea() != null ? usuario.getArea().getNombre() : null;
        String grado = usuario.getGradoProfesional() != null ? usuario.getGradoProfesional().name() : "SIN_GRADO";

        return new UsuarioRespuesta(
            usuario.getIdUsuario(),
            usuario.getNombres(),
            usuario.getApellidos(),
            nombreCompleto,
            usuario.getNombreVisible(),
            usuario.getNombreUsuario(),
            grado,
            usuario.getCorreo(),
            usuario.getRol(),
            usuario.getNivelSoporte(),
            idArea,
            areaNombre,
            usuario.getDebeCambiarContrasena(),
            usuario.getUltimoAcceso(),
            usuario.getActivo(),
            usuario.getFechaCreacion(),
            contrasenaTemporal
        );
    }

    public static com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioResumen toResumen(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        com.hospital.servicedesk.administrativo.areas.dto.AreaMini areaMini = usuario.getArea() != null
                ? new com.hospital.servicedesk.administrativo.areas.dto.AreaMini(usuario.getArea().getIdArea(), usuario.getArea().getNombre())
                : null;

        String grado = usuario.getGradoProfesional() != null ? usuario.getGradoProfesional().name() : "SIN_GRADO";

        return new com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioResumen(
                usuario.getIdUsuario(),
                usuario.getNombreVisible(),
                grado,
                usuario.getCorreo(),
                usuario.getNombreUsuario(),
                usuario.getRol(),
                areaMini,
                Boolean.TRUE.equals(usuario.getActivo()),
                usuario.getUltimoAcceso()
        );
    }
}
