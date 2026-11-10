
package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final AreaRepository areaRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Usuario> getTecnicosActivos() {
        return usuarioRepo.findAll().stream()
                .filter(u -> (u.getRol() != null && ("TECNICO".equalsIgnoreCase(u.getRol()) || "PRACTICANTE".equalsIgnoreCase(u.getRol()) || "ADMINISTRADOR".equalsIgnoreCase(u.getRol()))) && (u.getActivo() == null || u.getActivo()))
                .collect(Collectors.toList());
    }

    @Override
    public List<Usuario> getAllUsuarios() {
        return usuarioRepo.findAll();
    }

    @Override
    @Transactional
    public Usuario createUsuario(Map<String, Object> req) {
        String correo = (String) req.get("correo");
        if (usuarioRepo.findByCorreo(correo).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo ya está registrado");
        }
        Integer idArea = (Integer) req.get("idArea");
        Area area = areaRepo.findById(idArea)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));

        String rawPassword = req.get("contrasena") != null ? (String) req.get("contrasena") : "Temp2026*";
        byte[] hash = passwordEncoder.encode(rawPassword).getBytes(StandardCharsets.UTF_8);

        Usuario usuario = Usuario.builder()
                .nombres((String) req.get("nombres"))
                .apellidos((String) req.get("apellidos"))
                .correo(correo)
                .contrasenaHash(hash)
                .rol((String) req.get("rol"))
                .nivelSoporte((String) req.get("nivelSoporte"))
                .area(area)
                .activo(true)
                .build();

        return usuarioRepo.save(usuario);
    }

    @Override
    @Transactional
    public Usuario updateUsuario(Integer id, Map<String, Object> req) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        if (req.get("nombres") != null) usuario.setNombres((String) req.get("nombres"));
        if (req.get("apellidos") != null) usuario.setApellidos((String) req.get("apellidos"));
        if (req.get("rol") != null) usuario.setRol((String) req.get("rol"));
        if (req.get("nivelSoporte") != null) usuario.setNivelSoporte((String) req.get("nivelSoporte"));
        if (req.get("idArea") != null) {
            Integer idArea = (Integer) req.get("idArea");
            Area area = areaRepo.findById(idArea).orElse(null);
            if (area != null) usuario.setArea(area);
        }

        return usuarioRepo.save(usuario);
    }

    @Override
    @Transactional
    public Usuario toggleActivo(Integer id) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        usuario.setActivo(usuario.getActivo() == null || !usuario.getActivo());
        return usuarioRepo.save(usuario);
    }

    @Override
    @Transactional
    public void cambiarContrasena(String email, String nuevaContrasena) {
        Usuario usuario = usuarioRepo.findByCorreo(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        byte[] hash = passwordEncoder.encode(nuevaContrasena).getBytes(StandardCharsets.UTF_8);
        usuario.setContrasenaHash(hash);
        usuarioRepo.save(usuario);
    }
}

