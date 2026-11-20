package com.hospital.servicedesk.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class UsuarioDTOs {

    private UsuarioDTOs() {}

    /**
     * DTO de respuesta seguro que NUNCA expone el hash de contraseña.
     */
    public record UsuarioRespuesta(
        Integer idUsuario,
        String nombres,
        String apellidos,
        String nombreCompleto,
        String correo,
        String rol,
        String nivelSoporte,
        Integer idArea,
        String areaNombre,
        Boolean activo,
        LocalDateTime fechaCreacion
    ) {}

    /**
     * Solicitud para registrar un nuevo personal o usuario.
     */
    public record UsuarioRegistroRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 80, message = "Los apellidos no pueden superar 80 caracteres")
        String apellidos,

        @NotBlank(message = "El correo institucional es obligatorio")
        @Email(message = "Formato de correo electrónico no válido")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        String correo,

        String contrasena,

        @NotBlank(message = "El rol es obligatorio")
        String rol,

        String nivelSoporte,

        @NotNull(message = "El área hospitalaria es obligatoria")
        Integer idArea
    ) {}

    /**
     * Solicitud para actualizar datos del personal o usuario.
     */
    public record UsuarioActualizarRequest(
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombres,

        @Size(max = 80, message = "Los apellidos no pueden superar 80 caracteres")
        String apellidos,

        @Email(message = "Formato de correo electrónico no válido")
        @Size(max = 100, message = "El correo no puede superar 100 caracteres")
        String correo,

        String rol,
        String nivelSoporte,
        Integer idArea,
        Boolean activo
    ) {}

    /**
     * Solicitud para cambio de contraseña seguro.
     */
    public record CambioContrasenaRequest(
        String contrasenaActual,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 6, max = 50, message = "La nueva contraseña debe tener entre 6 y 50 caracteres")
        String nuevaContrasena
    ) {}
}
