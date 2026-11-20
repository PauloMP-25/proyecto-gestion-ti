package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.UsuarioDTOs.CambioContrasenaRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioActualizarRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRegistroRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.services.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping("/usuarios/tecnicos")
    public ResponseEntity<List<UsuarioRespuesta>> getTecnicosActivos() {
        return ResponseEntity.ok(usuarioService.getTecnicosActivos());
    }

    @GetMapping("/usuarios")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UsuarioRespuesta>> getAllUsuarios() {
        return ResponseEntity.ok(usuarioService.getAllUsuarios());
    }

    @PostMapping("/usuarios")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> createUsuario(@Valid @RequestBody UsuarioRegistroRequest request) {
        UsuarioRespuesta usuario = usuarioService.createUsuario(request);
        return new ResponseEntity<>(usuario, HttpStatus.CREATED);
    }

    @PutMapping("/usuarios/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> updateUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioActualizarRequest request) {
        UsuarioRespuesta usuario = usuarioService.updateUsuario(id, request);
        return ResponseEntity.ok(usuario);
    }

    @PatchMapping("/usuarios/{id}/activo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> toggleActivo(@PathVariable Integer id) {
        UsuarioRespuesta usuario = usuarioService.toggleActivo(id);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/auth/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasena(
            @Valid @RequestBody CambioContrasenaRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Debe iniciar sesión para cambiar su contraseña"));
        }
        String email = authentication.getName();
        usuarioService.cambiarContrasena(email, request.contrasenaActual(), request.nuevaContrasena());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }
}
