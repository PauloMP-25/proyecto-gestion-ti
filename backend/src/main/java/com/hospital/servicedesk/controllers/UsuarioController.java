package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.dtos.UsuarioDTOs.CambioContrasenaRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.RestablecerContrasenaRespuesta;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioActualizarRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRegistroRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.exceptions.NoAutorizadoException;
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

    @GetMapping({"/usuarios", "/admin/personal"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<PaginaRespuesta<UsuarioRespuesta>> getAllUsuarios(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            @RequestParam(required = false) String busqueda) {
        return ResponseEntity.ok(usuarioService.getUsuariosPaginados(pagina, tamano, busqueda));
    }

    @GetMapping({"/usuarios/{id}", "/admin/personal/{id}"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> getUsuarioById(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.getUsuarioById(id));
    }

    @PostMapping({"/usuarios", "/admin/personal"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> createUsuario(@Valid @RequestBody UsuarioRegistroRequest request) {
        UsuarioRespuesta usuario = usuarioService.createUsuario(request);
        return new ResponseEntity<>(usuario, HttpStatus.CREATED);
    }

    @PutMapping({"/usuarios/{id}", "/admin/personal/{id}"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> updateUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioActualizarRequest request) {
        UsuarioRespuesta usuario = usuarioService.updateUsuario(id, request);
        return ResponseEntity.ok(usuario);
    }

    @PatchMapping({"/usuarios/{id}/activo", "/admin/personal/{id}/activo"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UsuarioRespuesta> toggleActivo(@PathVariable Integer id) {
        UsuarioRespuesta usuario = usuarioService.toggleActivo(id);
        return ResponseEntity.ok(usuario);
    }

    @PostMapping({"/usuarios/{id}/restablecer-contrasena", "/admin/personal/{id}/restablecer-contrasena"})
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<RestablecerContrasenaRespuesta> restablecerContrasena(@PathVariable Integer id) {
        return ResponseEntity.ok(usuarioService.restablecerContrasena(id));
    }

    @PutMapping("/cuenta/contrasena")
    public ResponseEntity<Map<String, String>> cambiarContrasena(
            @Valid @RequestBody CambioContrasenaRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NoAutorizadoException("Debe iniciar sesión para cambiar su contraseña");
        }
        String email = authentication.getName();
        usuarioService.cambiarContrasena(email, request.contrasenaActual(), request.nuevaContrasena());
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }
}
