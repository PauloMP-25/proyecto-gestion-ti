package com.hospital.servicedesk.config.semillas;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "servicedesk.semillas.personal", name = "habilitado", havingValue = "true")
public class SemillaPersonalHsmsi implements ApplicationRunner {

    private record Persona(String usuario, String nombres, String apellidos, GradoProfesional grado,
                           String rol, String nivelSoporte, String area) {}

    private static final String DOMINIO = "@hsmsi.gob.pe";

    private static final List<Persona> PERSONAL = List.of(
            new Persona("jefe.ti",          "Mariela",  "Castillo Vargas",  GradoProfesional.ING, "ADMINISTRADOR", null, "Tecnología de la Información"),
            new Persona("tec.soporte1",     "Jorge",    "Paredes Lima",     GradoProfesional.TEC, "TECNICO",       "N1", "Estadística e Informática"),
            new Persona("tec.soporte2",     "Lucía",    "Rojas Medina",     GradoProfesional.ING, "TECNICO",       "N2", "Tecnología de la Información"),
            new Persona("tec.redes",        "Andrés",   "Salazar Núñez",    GradoProfesional.ING, "TECNICO",       "N2", "Tecnología de la Información"),
            new Persona("prac.soporte",     "Diego",    "Quispe Huamaní",   GradoProfesional.SIN_GRADO, "PRACTICANTE", "N1", "Estadística e Informática"),
            new Persona("adm.central",      "Rosa",     "Flores Ccama",     GradoProfesional.TEC, "USUARIO_FINAL", null, "Admisión Central y Triaje"),
            new Persona("caja.ventanilla1", "Pedro",    "Gutiérrez Soto",   GradoProfesional.SIN_GRADO, "USUARIO_FINAL", null, "Caja"),
            new Persona("enf.emergencia",   "Carmen",   "Huamán Torres",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Emergencia Admisión"),
            new Persona("far.emergencia",   "Víctor",   "Mamani Quispe",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Farmacia Emergencia"),
            new Persona("far.central",      "Silvia",   "Ramos Chávez",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Farmacia Central"),
            new Persona("med.pediatria",    "Ricardo",  "Vega Montoya",     GradoProfesional.DR,  "USUARIO_FINAL", null, "Pediatría"),
            new Persona("obs.materno1",     "Patricia", "León Alarcón",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Materno 1"),
            new Persona("med.medicina1",    "Fernanda", "Ortiz Salas",      GradoProfesional.DRA, "USUARIO_FINAL", null, "Medicina 1"),
            new Persona("ter.fisioterapia", "Miguel",   "Cárdenas Ríos",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Fisioterapia"),
            new Persona("psi.psicologia1",  "Ana",      "Delgado Pinto",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Psicología 1"),
            new Persona("psi.psicologia3",  "Elena",    "Navarro Cruz",     GradoProfesional.MG,  "USUARIO_FINAL", null, "Psicología 3"),
            new Persona("enf.triaje",       "Julia",    "Espinoza Arias",   GradoProfesional.LIC, "USUARIO_FINAL", null, "Triaje Principal"),
            new Persona("med.psiquiatria",  "Óscar",    "Benavides Luna",   GradoProfesional.DR,  "USUARIO_FINAL", null, "Psiquiatría"),
            new Persona("psi.psicologia2",  "Gabriela", "Fuentes Ruiz",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Psicología 2"),
            new Persona("odo.ninos",        "Claudia",  "Tapia Herrera",    GradoProfesional.DRA, "USUARIO_FINAL", null, "Dental Niños"),
            new Persona("odo.adultos",      "Raúl",     "Campos Ibáñez",    GradoProfesional.DR,  "USUARIO_FINAL", null, "Dental Adultos"),
            new Persona("med.cardiologia",  "Hugo",     "Zevallos Prado",   GradoProfesional.DR,  "USUARIO_FINAL", null, "Cardiología"),
            new Persona("med.dermatologia", "Verónica", "Aguilar Pérez",    GradoProfesional.DRA, "USUARIO_FINAL", null, "Dermatología"),
            new Persona("obs.planificacion","Liliana",  "Morales Ventura",  GradoProfesional.LIC, "USUARIO_FINAL", null, "Planificación Familiar")
    );

    private final UsuarioRepository usuarioRepository;
    private final AreaRepository areaRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Value("${servicedesk.semillas.personal.clave-inicial:}")
    private String claveInicial;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (claveInicial == null || claveInicial.length() < 8) {
            log.warn("Semilla de personal omitida: defina SEMILLA_CLAVE_INICIAL (mínimo 8 caracteres).");
            return;
        }
        byte[] hash = passwordEncoder.encode(claveInicial).getBytes(StandardCharsets.UTF_8);
        int creados = 0;
        for (Persona p : PERSONAL) {
            if (usuarioRepository.findByNombreUsuario(p.usuario()).isPresent()) continue;
            Area area = areaRepository.findByNombreIgnoreCase(p.area()).orElse(null);
            if (area == null) {
                log.warn("Semilla de personal: área «{}» inexistente; se omite {}.", p.area(), p.usuario());
                continue;
            }
            usuarioRepository.save(Usuario.builder()
                    .nombreUsuario(p.usuario())
                    .nombres(p.nombres())
                    .apellidos(p.apellidos())
                    .gradoProfesional(p.grado())
                    .correo(p.usuario() + DOMINIO)
                    .contrasenaHash(hash)
                    .rol(p.rol())
                    .nivelSoporte(p.nivelSoporte())
                    .area(area)
                    .debeCambiarContrasena(true)
                    .intentosFallidos(0)
                    .activo(true)
                    .fechaCreacion(LocalDateTime.now(clock))
                    .build());
            creados++;
        }
        log.info("Semilla de personal: {} usuarios nuevos ({} definidos).", creados, PERSONAL.size());
    }
}
