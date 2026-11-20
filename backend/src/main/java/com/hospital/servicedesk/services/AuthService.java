package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.AuthDTOs.AuthResponse;
import com.hospital.servicedesk.dtos.AuthDTOs.LoginRequest;
import org.springframework.security.core.Authentication;

import java.util.Map;

/**
 * Contrato de servicio para operaciones de autenticación y consulta de sesión activa.
 */
public interface AuthService {

    /**
     * Autentica a un usuario hospitalario mediante credenciales (correo y contraseña).
     *
     * @param request Datos de acceso con correo y contraseña.
     * @return Respuesta con token JWT firmado y datos de rol.
     */
    AuthResponse login(LoginRequest request);

    /**
     * Obtiene la información del usuario autenticado en la sesión actual.
     *
     * @param authentication Contexto de autenticación de Spring Security.
     * @return Mapa de atributos del usuario conectado.
     */
    Map<String, Object> getCurrentUser(Authentication authentication);
}
