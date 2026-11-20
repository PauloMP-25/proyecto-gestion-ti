package com.hospital.servicedesk.config;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * Inicializador de datos semilla que garantiza la existencia de un área base y
 * las cuentas de acceso iniciales para permitir pruebas directas del sistema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final AreaRepository areaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            log.info("Base de datos ya cuenta con usuarios registrados. Omitiendo seed inicial.");
            return;
        }

        log.info("Inicializando área institucional y usuarios de prueba iniciales...");

        // 1. Área inicial de Informática
        Area areaInformatica = areaRepository.findByNombreIgnoreCase("Oficina de Informática y Telecomunicaciones")
                .orElseGet(() -> areaRepository.save(Area.builder()
                        .nombre("Oficina de Informática y Telecomunicaciones")
                        .piso("Piso 2")
                        .referenciaUbicacion("Pabellón Central - Administración")
                        .anexo("104")
                        .activo(true)
                        .build()));

        // 2. Administrador del Sistema (admin / admin)
        byte[] hashAdmin = passwordEncoder.encode("admin").getBytes(StandardCharsets.UTF_8);
        Usuario admin = Usuario.builder()
                .nombres("Roberto")
                .apellidos("Ramos Cárdenas")
                .correo("admin@hsms.gob.pe")
                .nombreUsuario("admin")
                .gradoProfesional(GradoProfesional.ING)
                .contrasenaHash(hashAdmin)
                .rol("ADMINISTRADOR")
                .area(areaInformatica)
                .debeCambiarContrasena(false)
                .intentosFallidos(0)
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(admin);

        // 3. Técnico / Practicante Soporte N1 (practicante / admin)
        byte[] hashPracticante = passwordEncoder.encode("admin").getBytes(StandardCharsets.UTF_8);
        Usuario practicante = Usuario.builder()
                .nombres("Carlos")
                .apellidos("Huamán Soto")
                .correo("soporte@hsms.gob.pe")
                .nombreUsuario("practicante")
                .gradoProfesional(GradoProfesional.TEC)
                .contrasenaHash(hashPracticante)
                .rol("PRACTICANTE")
                .nivelSoporte("N1")
                .area(areaInformatica)
                .debeCambiarContrasena(false)
                .intentosFallidos(0)
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(practicante);

        // 4. Usuario Asistencial Médico (usuario / admin)
        byte[] hashUsuario = passwordEncoder.encode("admin").getBytes(StandardCharsets.UTF_8);
        Usuario usuarioFinal = Usuario.builder()
                .nombres("Rosa")
                .apellidos("Mendoza Quispe")
                .correo("usuario@hsms.gob.pe")
                .nombreUsuario("usuario")
                .gradoProfesional(GradoProfesional.DRA)
                .contrasenaHash(hashUsuario)
                .rol("USUARIO_FINAL")
                .area(areaInformatica)
                .debeCambiarContrasena(false)
                .intentosFallidos(0)
                .activo(true)
                .fechaCreacion(LocalDateTime.now())
                .build();
        usuarioRepository.save(usuarioFinal);

        log.info("Usuarios iniciales creados exitosamente: admin, practicante, usuario (clave: admin)");
    }
}
