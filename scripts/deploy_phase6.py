import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 6A. Migration V1_6 SQL
v1_6_sql = """-- =============================================================================
-- Migración V1_6: Semillas de áreas, equipos, red y guías del KEDB
-- Base de datos: SQL Server
-- =============================================================================

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 0. Áreas adicionales ---------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Farmacia Central')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Farmacia Central', N'Piso 1', N'Pabellón de Consultorios Externos', '105', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Admisión Central y Triaje')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Admisión Central y Triaje', N'Piso 1', N'Hall Central - Módulos de Admisión General', '101', 'P1', 1);

-- 1. Catálogo de equipos semilla -----------------------------------------------
-- (Insertados si no existen por código de inventario)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'PC-ADM-01')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo, marca, modelo, numero_serie, estado, id_area, fecha_adquisicion, observaciones)
    VALUES ('PC-ADM-01', N'PC Admisión módulo 1', 'COMPUTADORA', N'Lenovo', N'ThinkCentre M70q', N'SN-LNV-001', 'ACTIVO', 
            (SELECT TOP 1 id_area FROM dbo.area WHERE nombre = N'Admisión Central y Triaje'), GETDATE(), N'Semilla V1_6');

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'IMP-ADM-01')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo, marca, modelo, numero_serie, estado, id_area, fecha_adquisicion, observaciones)
    VALUES ('IMP-ADM-01', N'Impresora de pulseras Admisión', 'IMPRESORA', N'Zebra', N'ZD510-HC', N'SN-ZBR-001', 'ACTIVO', 
            (SELECT TOP 1 id_area FROM dbo.area WHERE nombre = N'Admisión Central y Triaje'), GETDATE(), N'Semilla V1_6');

-- 2. Guías iniciales del KEDB --------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.error_conocido WHERE titulo LIKE '%Zebra%')
    INSERT INTO dbo.error_conocido (titulo, descripcion_problema, solucion_trabajo, publicado, fecha_creacion, categoria, ambito, sintoma, causa_raiz, nivel_dificultad, minutos_estimados, requiere_tecnico, palabras_clave, equipos_compatibles, fecha_actualizacion, texto_busqueda)
    VALUES (
        N'Impresora Zebra ZD510-HC no imprime pulseras de identificación',
        N'La impresora parpadea en rojo y no expulsa la pulsera al intentar emitir admisión.',
        N'1. Verifique que el rollo de pulseras térmicas esté correctamente alineado en el sensor.\n2. Reinicie el servicio de cola de impresión en Windows.\n3. Calibre el sensor manteniendo presionado el botón de alimentación hasta que parpadee 2 veces.',
        1, GETDATE(), 'IMPRESORAS_TERMICAS', 'PUBLICO_ASISTENCIAL',
        N'Luz roja intermitente y atasco de pulseras', N'Sensor óptico descalibrado o rollo mal colocado',
        'BASICO', 10, 0, 'zebra,pulseras,admision,impresora', 'IMP-ADM-01,ZD510', GETDATE(),
        'impresora zebra zd510 hc no imprime pulseras de identificacion luz roja intermitente sensor'
    );

IF NOT EXISTS (SELECT 1 FROM dbo.error_conocido WHERE titulo LIKE '%HIS%')
    INSERT INTO dbo.error_conocido (titulo, descripcion_problema, solucion_trabajo, publicado, fecha_creacion, categoria, ambito, sintoma, causa_raiz, nivel_dificultad, minutos_estimados, requiere_tecnico, palabras_clave, equipos_compatibles, fecha_actualizacion, texto_busqueda)
    VALUES (
        N'Error de conexión con la base de datos central del HIS en admisiones',
        N'Pantalla en blanco o mensaje \"Timeout de conexión con el servidor HIS\" al buscar pacientes.',
        N'1. Compruebe el estado del cable de red UTP en el switch del rack local.\n2. Verifique la IP estática del equipo.\n3. Ejecute ping al servidor central 10.20.1.100.',
        1, GETDATE(), 'SISTEMA_CLINICO', 'INTERNO_TECNICO',
        N'Timeout de conexion HIS', N'Corte temporal de red o caída del servicio de base de datos',
        'INTERMEDIO', 15, 1, 'his,conexion,red,base,datos', 'PC-ADM-01,SWITCH-CORE', GETDATE(),
        'error de conexion con la base de datos central del his en admisiones timeout'
    );

COMMIT TRANSACTION;
"""

write_file("backend/src/main/resources/db/migraciones/V1_6__semillas_equipos_red_y_guias.sql", v1_6_sql)

# 6B. SemillaPersonalHsmsi.java
semilla_java = """package com.hospital.servicedesk.config.semillas;

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
"""

write_file("backend/src/main/java/com/hospital/servicedesk/config/semillas/SemillaPersonalHsmsi.java", semilla_java)

# Update application.properties to include personal seed properties
props_path = "backend/src/main/resources/application.properties"
with open(props_path, "r", encoding="utf-8") as f:
    props = f.read()

if "servicedesk.semillas.personal" not in props:
    props += "\n\n# Semilla de Personal\nservicedesk.semillas.personal.habilitado=${SEMILLA_PERSONAL_HABILITADO:true}\nservicedesk.semillas.personal.clave-inicial=${SEMILLA_CLAVE_INICIAL:Hospital2026*}\n"
    with open(props_path, "w", encoding="utf-8") as f:
        f.write(props)
    print("Updated application.properties with personal seed config")
