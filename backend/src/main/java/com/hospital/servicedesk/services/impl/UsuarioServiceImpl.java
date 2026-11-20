package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioActualizarRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRegistroRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.mappers.UsuarioMapper;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final AreaRepository areaRepo;
    private final PasswordEncoder passwordEncoder;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRespuesta> getTecnicosActivos() {
        return usuarioRepo.findAll().stream()
                .filter(u -> (u.getRol() != null && (
                        "TECNICO".equalsIgnoreCase(u.getRol()) ||
                        "PRACTICANTE".equalsIgnoreCase(u.getRol()) ||
                        "ADMINISTRADOR".equalsIgnoreCase(u.getRol())
                )) && (u.getActivo() == null || u.getActivo()))
                .map(UsuarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioRespuesta> getAllUsuarios() {
        return usuarioRepo.findAll().stream()
                .map(UsuarioMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UsuarioRespuesta createUsuario(UsuarioRegistroRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepo.findByCorreo(correo).isPresent()) {
            throw new ConflictoNegocioException("El correo electrónico ya está registrado");
        }

        Area area = areaRepo.findById(req.idArea())
                .orElseThrow(() -> new RecursoNoEncontradoException("Área hospitalaria", req.idArea()));

        String rawPassword = (req.contrasena() != null && !req.contrasena().isBlank())
                ? req.contrasena()
                : generarContrasenaSegura();

        byte[] hash = passwordEncoder.encode(rawPassword).getBytes(StandardCharsets.UTF_8);

        Usuario usuario = Usuario.builder()
                .nombres(req.nombres().trim())
                .apellidos(req.apellidos().trim())
                .correo(correo)
                .contrasenaHash(hash)
                .rol(req.rol())
                .nivelSoporte(req.nivelSoporte())
                .area(area)
                .activo(true)
                .build();

        return UsuarioMapper.toResponse(usuarioRepo.save(usuario));
    }

    @Override
    @Transactional
    public UsuarioRespuesta updateUsuario(Integer id, UsuarioActualizarRequest req) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));

        if (req.nombres() != null && !req.nombres().isBlank()) {
            usuario.setNombres(req.nombres().trim());
        }
        if (req.apellidos() != null && !req.apellidos().isBlank()) {
            usuario.setApellidos(req.apellidos().trim());
        }
        if (req.correo() != null && !req.correo().isBlank()) {
            String nuevoCorreo = req.correo().trim().toLowerCase();
            if (!nuevoCorreo.equalsIgnoreCase(usuario.getCorreo()) && usuarioRepo.findByCorreo(nuevoCorreo).isPresent()) {
                throw new ConflictoNegocioException("El correo electrónico ya está registrado por otro usuario");
            }
            usuario.setCorreo(nuevoCorreo);
        }
        if (req.rol() != null && !req.rol().isBlank()) {
            usuario.setRol(req.rol());
        }
        if (req.nivelSoporte() != null) {
            usuario.setNivelSoporte(req.nivelSoporte());
        }
        if (req.idArea() != null) {
            Area area = areaRepo.findById(req.idArea())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Área hospitalaria", req.idArea()));
            usuario.setArea(area);
        }
        if (req.activo() != null) {
            usuario.setActivo(req.activo());
        }

        return UsuarioMapper.toResponse(usuarioRepo.save(usuario));
    }

    @Override
    @Transactional
    public UsuarioRespuesta toggleActivo(Integer id) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
        usuario.setActivo(usuario.getActivo() == null || !usuario.getActivo());
        return UsuarioMapper.toResponse(usuarioRepo.save(usuario));
    }

    @Override
    @Transactional
    public void cambiarContrasena(String email, String actual, String nuevaContrasena) {
        Usuario usuario = usuarioRepo.findByCorreo(email)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", email));

        if (actual != null && !actual.isBlank()) {
            String hashAlmacenado = new String(usuario.getContrasenaHash(), StandardCharsets.UTF_8);
            if (!passwordEncoder.matches(actual, hashAlmacenado)) {
                throw new ReglaNegocioException("La contraseña actual no es correcta");
            }
        }

        byte[] nuevoHash = passwordEncoder.encode(nuevaContrasena).getBytes(StandardCharsets.UTF_8);
        usuario.setContrasenaHash(nuevoHash);
        usuarioRepo.save(usuario);
    }

    private String generarContrasenaSegura() {
        final String caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(caracteres.charAt(RANDOM.nextInt(caracteres.length())));
        }
        return sb.toString();
    }
}
