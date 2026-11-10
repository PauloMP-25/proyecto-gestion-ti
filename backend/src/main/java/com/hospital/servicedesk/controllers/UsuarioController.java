
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<Usuario>> getTecnicosActivos() {
        return ResponseEntity.ok(usuarioService.getTecnicosActivos());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> getAllUsuarios() {
        return ResponseEntity.ok(usuarioService.getAllUsuarios());
    }

    @PostMapping("/usuarios")
    public ResponseEntity<Usuario> createUsuario(@RequestBody Map<String, Object> request) {
        Usuario usuario = usuarioService.createUsuario(request);
        return new ResponseEntity<>(usuario, HttpStatus.CREATED);
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> updateUsuario(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        Usuario usuario = usuarioService.updateUsuario(id, request);
        return ResponseEntity.ok(usuario);
    }

    @PatchMapping("/usuarios/{id}/activo")
    public ResponseEntity<Usuario> toggleActivo(@PathVariable Integer id) {
        Usuario usuario = usuarioService.toggleActivo(id);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/auth/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasena(@RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : request.get("correo");
        String nuevaContrasena = request.get("nuevaContrasena");
        usuarioService.cambiarContrasena(email, nuevaContrasena);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }
}

