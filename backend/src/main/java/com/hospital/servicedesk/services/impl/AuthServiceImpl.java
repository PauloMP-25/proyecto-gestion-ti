package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.AuthDTOs.AuthResponse;
import com.hospital.servicedesk.dtos.AuthDTOs.LoginRequest;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.CredencialesInvalidasException;
import com.hospital.servicedesk.exceptions.NoAutorizadoException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.UsuarioInactivoException;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.security.service.JwtService;
import com.hospital.servicedesk.services.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new CredencialesInvalidasException("Credenciales inválidas"));

        if (usuario.getActivo() != null && !usuario.getActivo()) {
            throw new UsuarioInactivoException("Usuario inactivo en el sistema");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getCorreo(),
                        request.getContrasena()));

        String token = jwtService.generateToken((UserDetails) authentication.getPrincipal());

        log.info("Inicio de sesión exitoso para usuario: {}", usuario.getCorreo());

        return new AuthResponse(
                token,
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getNivelSoporte());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NoAutorizadoException("No autenticado");
        }

        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", correo));

        return Map.of(
                "idUsuario", usuario.getIdUsuario(),
                "nombres", usuario.getNombres(),
                "apellidos", usuario.getApellidos(),
                "correo", usuario.getCorreo(),
                "rol", usuario.getRol(),
                "nivelSoporte", usuario.getNivelSoporte() != null ? usuario.getNivelSoporte() : "",
                "activo", usuario.getActivo()
        );
    }
}
