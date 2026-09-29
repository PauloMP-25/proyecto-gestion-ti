package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.AuthDTOs.*;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.security.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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
    public ResponseEntity<AuthResponse> loginTecnico(
            @Valid @RequestBody LoginRequest request) {

        Usuario usuario = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Credenciales inválidas"
                        )
                );

        if (!"TECNICO".equalsIgnoreCase(usuario.getRol())
                || usuario.getNivelSoporte() == null) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acceso denegado: El inicio de sesión está habilitado únicamente para personal técnico"
            );
        }

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                request.getCorreo(),
                                request.getContrasena()
                        )
                );

        String token = jwtService.generateToken(
                (org.springframework.security.core.userdetails.UserDetails)
                        authentication.getPrincipal()
        );

        AuthResponse response = new AuthResponse(
                token,
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getNivelSoporte()
        );

        return ResponseEntity.ok(response);
    }

}
