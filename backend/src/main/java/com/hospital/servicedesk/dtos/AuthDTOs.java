package com.hospital.servicedesk.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDTOs {

    @Data
    public static class LoginRequest {
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Formato de correo inválido")
        private String correo;

        @NotBlank(message = "La contraseña es obligatoria")
        private String contrasena;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String tipo = "Bearer";
        private String correo;
        private String rol;
        private String nivelSoporte;

        public AuthResponse(String token, String correo, String rol, String nivelSoporte) {
            this.token = token;
            this.correo = correo;
            this.rol = rol;
            this.nivelSoporte = nivelSoporte;
        }
    }
}
