package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.ConfiguracionSLA;
import com.hospital.servicedesk.repositories.ConfiguracionSlaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Controlador para la configuración y mantenimiento de la matriz de
 * tiempos de atención y respuesta (SLA) de la Mesa de Ayuda HSMSI.
 * Accesible para el Administrador / Ingeniero de TI.
 */
@RestController
@RequestMapping("/api/sla/configuracion")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class SlaConfiguracionController {

    private final ConfiguracionSlaRepository slaRepository;

    public SlaConfiguracionController(ConfiguracionSlaRepository slaRepository) {
        this.slaRepository = slaRepository;
    }

    public record ReglaSlaDTO(
            String prioridad,
            String nombre,
            Integer tiempoRespuestaMin,
            Integer tiempoResolucionMin,
            Integer notificarJefaturaMin,
            Boolean aplicaHorarioLaboral,
            String colorClase,
            String descripcionHospitalaria
    ) {}

    @GetMapping
    public ResponseEntity<List<ReglaSlaDTO>> obtenerConfiguracion() {
        List<ConfiguracionSLA> guardados = slaRepository.findAll();

        if (guardados.isEmpty()) {
            return ResponseEntity.ok(obtenerReglasPorDefecto());
        }

        // Construir reglas agregadas por prioridad a partir de la tabla
        List<ReglaSlaDTO> reglas = new ArrayList<>();
        reglas.add(construirRegla("P1", "Crítica (STAT)", 15, 60, 20, false, "p1-critica",
                "Soporte vital inmediato: Fallas en Shock Trauma, UCI, Servidor HIS o Tomógrafo.", guardados));
        reglas.add(construirRegla("P2", "Alta", 30, 120, 45, false, "p2-alta",
                "Afectación a todo un servicio asistencial: Farmacia central, Triaje o Admisión.", guardados));
        reglas.add(construirRegla("P3", "Media", 60, 480, 120, true, "p3-media",
                "Degradación parcial en consultorios externos o terminales de enfermería.", guardados));
        reglas.add(construirRegla("P4", "Baja", 120, 1440, 360, true, "p4-baja",
                "Solicitud administrativa o estación no asistencial.", guardados));

        return ResponseEntity.ok(reglas);
    }

    @PutMapping
    @Transactional
    public ResponseEntity<List<ReglaSlaDTO>> actualizarConfiguracion(@RequestBody List<ReglaSlaDTO> nuevasReglas) {
        if (nuevasReglas == null || nuevasReglas.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        for (ReglaSlaDTO regla : nuevasReglas) {
            List<ConfiguracionSLA> configs = slaRepository.findByPrioridadResultante(regla.prioridad());
            if (configs.isEmpty()) {
                // Si no existían registros para esa prioridad, crear combinaciones base
                crearConfiguracionesBase(regla.prioridad(), regla.tiempoRespuestaMin(), regla.tiempoResolucionMin());
            } else {
                for (ConfiguracionSLA c : configs) {
                    c.setMinutosRespuesta(regla.tiempoRespuestaMin());
                    c.setMinutosResolucion(regla.tiempoResolucionMin());
                    slaRepository.save(c);
                }
            }
        }

        return ResponseEntity.ok(nuevasReglas);
    }

    private ReglaSlaDTO construirRegla(String prioridad, String nombre, int respDef, int resDef, int notifDef,
                                       boolean laboral, String color, String desc, List<ConfiguracionSLA> guardados) {
        int resp = respDef;
        int res = resDef;
        for (ConfiguracionSLA c : guardados) {
            if (prioridad.equalsIgnoreCase(c.getPrioridadResultante())) {
                resp = c.getMinutosRespuesta() != null ? c.getMinutosRespuesta() : resp;
                res = c.getMinutosResolucion() != null ? c.getMinutosResolucion() : res;
                break;
            }
        }
        return new ReglaSlaDTO(prioridad, nombre, resp, res, notifDef, laboral, color, desc);
    }

    private void crearConfiguracionesBase(String prioridad, int minResp, int minResol) {
        String impacto = "MEDIO";
        String urgencia = "MEDIA";
        if ("P1".equalsIgnoreCase(prioridad)) {
            impacto = "ALTO";
            urgencia = "ALTA";
        } else if ("P2".equalsIgnoreCase(prioridad)) {
            impacto = "ALTO";
            urgencia = "MEDIA";
        } else if ("P4".equalsIgnoreCase(prioridad)) {
            impacto = "BAJO";
            urgencia = "BAJA";
        }

        ConfiguracionSLA nueva = ConfiguracionSLA.builder()
                .impacto(impacto)
                .urgencia(urgencia)
                .prioridadResultante(prioridad)
                .minutosRespuesta(minResp)
                .minutosResolucion(minResol)
                .build();
        slaRepository.save(nueva);
    }

    private List<ReglaSlaDTO> obtenerReglasPorDefecto() {
        return List.of(
                new ReglaSlaDTO("P1", "Crítica (STAT)", 15, 60, 20, false, "p1-critica",
                        "Soporte vital inmediato: Fallas en Shock Trauma, UCI, Servidor HIS o Tomógrafo."),
                new ReglaSlaDTO("P2", "Alta", 30, 120, 45, false, "p2-alta",
                        "Afectación a todo un servicio asistencial: Farmacia central, Triaje o Admisión."),
                new ReglaSlaDTO("P3", "Media", 60, 480, 120, true, "p3-media",
                        "Degradación parcial en consultorios externos o terminales de enfermería."),
                new ReglaSlaDTO("P4", "Baja", 120, 1440, 360, true, "p4-baja",
                        "Solicitud administrativa o estación no asistencial.")
        );
    }
}
