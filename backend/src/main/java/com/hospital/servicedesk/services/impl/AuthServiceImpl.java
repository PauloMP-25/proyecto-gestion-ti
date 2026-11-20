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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final Clock clock;

    private static final int MAX_INTENTOS_FALLIDOS = 5;
    private static final int MINUTOS_BLOQUEO = 15;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String correo = request.getCorreo().trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new CredencialesInvalidasException("Correo o contraseña incorrectos"));

        LocalDateTime ahora = LocalDateTime.now(clock);

        if (usuario.getActivo() != null && !usuario.getActivo()) {
            throw new UsuarioInactivoException("El usuario se encuentra inactivo en el sistema hospitalario");
        }

        if (usuario.getBloqueadoHasta() != null && usuario.getBloqueadoHasta().isAfter(ahora)) {
            throw new UsuarioInactivoException("La cuenta está temporalmente bloqueada por múltiples intentos fallidos. Intente más tarde.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            correo,
                            request.getContrasena()));

            // Éxito: limpiar intentos y actualizar último acceso
            usuario.setIntentosFallidos(0);
            usuario.setBloqueadoHasta(null);
            usuario.setUltimoAcceso(ahora);
            usuarioRepository.save(usuario);

            String token = jwtService.generateToken((UserDetails) authentication.getPrincipal());
            log.info("Inicio de sesión exitoso para: {}", usuario.getCorreo());

            return new AuthResponse(
                    token,
                    usuario.getCorreo(),
                    usuario.getRol(),
                    usuario.getNivelSoporte());

        } catch (BadCredentialsException e) {
            int intentos = (usuario.getIntentosFallidos() != null ? usuario.getIntentosFallidos() : 0) + 1;
            usuario.setIntentosFallidos(intentos);

            if (intentos >= MAX_INTENTOS_FALLIDOS) {
                usuario.setBloqueadoHasta(ahora.plusMinutes(MINUTOS_BLOQUEO));
                log.warn("Cuenta de usuario {} bloqueada por {} minutos tras {} intentos fallidos",
                        usuario.getCorreo(), MINUTOS_BLOQUEO, intentos);
            }
            usuarioRepository.save(usuario);

            throw new CredencialesInvalidasException("Correo o contraseña incorrectos");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NoAutorizadoException("No autenticado");
        }

        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", correo));

        Map<String, Object> datos = new HashMap<>();
        datos.put("idUsuario", usuario.getIdUsuario());
        datos.put("nombres", usuario.getNombres());
        datos.put("apellidos", usuario.getApellidos());
        datos.put("nombreVisible", usuario.getNombreVisible());
        datos.put("nombreUsuario", usuario.getNombreUsuario() != null ? usuario.getNombreUsuario() : "");
        datos.put("gradoProfesional", usuario.getGradoProfesional() != null ? usuario.getGradoProfesional().name() : "SIN_GRADO");
        datos.put("correo", usuario.getCorreo());
        datos.put("rol", usuario.getRol());
        datos.put("nivelSoporte", usuario.getNivelSoporte() != null ? usuario.getNivelSoporte() : "");
        datos.put("debeCambiarContrasena", usuario.getDebeCambiarContrasena() != null ? usuario.getDebeCambiarContrasena() : false);
        datos.put("activo", usuario.getActivo());

        return datos;
    }
}
