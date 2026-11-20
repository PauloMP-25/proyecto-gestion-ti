package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.dtos.UsuarioDTOs.RestablecerContrasenaRespuesta;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioActualizarRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRegistroRequest;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioRespuesta;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.mappers.UsuarioMapper;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.UsuarioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
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
    @Transactional(readOnly = true)
    public PaginaRespuesta<UsuarioRespuesta> getUsuariosPaginados(int pagina, int tamano, String busqueda) {
        List<Usuario> usuarios = usuarioRepo.findAll();

        List<UsuarioRespuesta> filtrados = usuarios.stream()
                .filter(u -> {
                    if (busqueda != null && !busqueda.isBlank()) {
                        String b = busqueda.toLowerCase().trim();
                        boolean matchNombre = u.getNombres() != null && u.getNombres().toLowerCase().contains(b);
                        boolean matchApellido = u.getApellidos() != null && u.getApellidos().toLowerCase().contains(b);
                        boolean matchCorreo = u.getCorreo() != null && u.getCorreo().toLowerCase().contains(b);
                        boolean matchUsuario = u.getNombreUsuario() != null && u.getNombreUsuario().toLowerCase().contains(b);
                        boolean matchRol = u.getRol() != null && u.getRol().toLowerCase().contains(b);
                        return matchNombre || matchApellido || matchCorreo || matchUsuario || matchRol;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    String nomA = (a.getNombres() != null ? a.getNombres() : "") + " " + (a.getApellidos() != null ? a.getApellidos() : "");
                    String nomB = (b.getNombres() != null ? b.getNombres() : "") + " " + (b.getApellidos() != null ? b.getApellidos() : "");
                    return nomA.compareToIgnoreCase(nomB);
                })
                .map(UsuarioMapper::toResponse)
                .toList();

        return PaginaRespuesta.of(filtrados, pagina, tamano);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioRespuesta getUsuarioById(Integer id) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));
        return UsuarioMapper.toResponse(usuario);
    }

    @Override
    @Transactional
    public UsuarioRespuesta createUsuario(UsuarioRegistroRequest req) {
        String correo = req.correo().trim().toLowerCase();
        if (usuarioRepo.existsByCorreoIgnoreCase(correo)) {
            throw new ConflictoNegocioException("El correo electrónico ya está registrado en el hospital");
        }

        String nombreUsuario = null;
        if (req.nombreUsuario() != null && !req.nombreUsuario().isBlank()) {
            nombreUsuario = req.nombreUsuario().trim().toLowerCase();
            if (usuarioRepo.existsByNombreUsuarioIgnoreCase(nombreUsuario)) {
                throw new ConflictoNegocioException("El nombre de usuario ya se encuentra en uso");
            }
        }

        GradoProfesional grado = parsearGrado(req.gradoProfesional());

        Area area = areaRepo.findById(req.idArea())
                .orElseThrow(() -> new RecursoNoEncontradoException("Área hospitalaria", req.idArea()));

        boolean esTemporal = (req.contrasena() == null || req.contrasena().isBlank());
        String rawPassword = esTemporal ? generarContrasenaSegura() : req.contrasena();

        byte[] hash = passwordEncoder.encode(rawPassword).getBytes(StandardCharsets.UTF_8);

        Usuario usuario = Usuario.builder()
                .nombres(req.nombres().trim())
                .apellidos(req.apellidos().trim())
                .correo(correo)
                .nombreUsuario(nombreUsuario)
                .gradoProfesional(grado)
                .contrasenaHash(hash)
                .rol(req.rol())
                .nivelSoporte(req.nivelSoporte())
                .area(area)
                .debeCambiarContrasena(esTemporal)
                .intentosFallidos(0)
                .activo(true)
                .build();

        Usuario guardado = usuarioRepo.save(usuario);
        log.info("Usuario creado exitosamente: {} con rol: {}", guardado.getCorreo(), guardado.getRol());

        return UsuarioMapper.toResponse(guardado, esTemporal ? rawPassword : null);
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
            if (!nuevoCorreo.equalsIgnoreCase(usuario.getCorreo()) && usuarioRepo.existsByCorreoIgnoreCase(nuevoCorreo)) {
                throw new ConflictoNegocioException("El correo electrónico ya está registrado por otro usuario");
            }
            usuario.setCorreo(nuevoCorreo);
        }
        if (req.nombreUsuario() != null) {
            String nuevoUser = req.nombreUsuario().trim().toLowerCase();
            if (!nuevoUser.isBlank()) {
                if (!nuevoUser.equalsIgnoreCase(usuario.getNombreUsuario()) && usuarioRepo.existsByNombreUsuarioIgnoreCase(nuevoUser)) {
                    throw new ConflictoNegocioException("El nombre de usuario ya se encuentra en uso por otro usuario");
                }
                usuario.setNombreUsuario(nuevoUser);
            } else {
                usuario.setNombreUsuario(null);
            }
        }
        if (req.gradoProfesional() != null) {
            usuario.setGradoProfesional(parsearGrado(req.gradoProfesional()));
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
    public RestablecerContrasenaRespuesta restablecerContrasena(Integer id) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", id));

        String nuevaClaveTemporal = generarContrasenaSegura();
        byte[] hash = passwordEncoder.encode(nuevaClaveTemporal).getBytes(StandardCharsets.UTF_8);

        usuario.setContrasenaHash(hash);
        usuario.setDebeCambiarContrasena(true);
        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);

        usuarioRepo.save(usuario);
        log.info("Contraseña temporal generada para usuario: {}", usuario.getCorreo());

        return new RestablecerContrasenaRespuesta(
                usuario.getCorreo(),
                nuevaClaveTemporal,
                "Contraseña restablecida exitosamente. Entregue la clave temporal al usuario."
        );
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
        usuario.setDebeCambiarContrasena(false);
        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);
        usuarioRepo.save(usuario);
    }

    private GradoProfesional parsearGrado(String gradoStr) {
        if (gradoStr == null || gradoStr.isBlank()) {
            return GradoProfesional.SIN_GRADO;
        }
        try {
            return GradoProfesional.valueOf(gradoStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ReglaNegocioException("Grado profesional no válido: " + gradoStr);
        }
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
