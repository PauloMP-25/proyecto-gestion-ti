package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.AuthDTOs.*;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.security.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Credenciales inválidas"));

            if (usuario.getActivo() != null && !usuario.getActivo()) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Usuario inactivo en el sistema");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getCorreo(),
                            request.getContrasena()));

            String token = jwtService.generateToken(
                    (org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());

            AuthResponse response = new AuthResponse(
                    token,
                    usuario.getCorreo(),
                    usuario.getRol(),
                    usuario.getNivelSoporte());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Correo o contraseña incorrectos"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("message", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error interno en el servidor de autenticación"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "No autenticado"));
        }
        String correo = authentication.getName();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        
        return ResponseEntity.ok(Map.of(
                "idUsuario", usuario.getIdUsuario(),
                "nombres", usuario.getNombres(),
                "apellidos", usuario.getApellidos(),
                "correo", usuario.getCorreo(),
                "rol", usuario.getRol(),
                "nivelSoporte", usuario.getNivelSoporte() != null ? usuario.getNivelSoporte() : "",
                "activo", usuario.getActivo()
        ));
    }
}
