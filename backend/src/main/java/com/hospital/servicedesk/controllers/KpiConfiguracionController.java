package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.ConfiguracionKPI;
import com.hospital.servicedesk.repositories.ConfiguracionKpiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Controlador para la calibración y configuración dinámica de los KPIs
 * y metas asistenciales por parte del Administrador del Hospital Santa María del Socorro.
 */
@Slf4j
@RestController
@RequestMapping("/api/kpis/configuracion")
@RequiredArgsConstructor
public class KpiConfiguracionController {

    private final ConfiguracionKpiRepository kpiRepository;

    @GetMapping
    public ResponseEntity<List<ConfiguracionKPI>> obtenerConfiguracion() {
        List<ConfiguracionKPI> existentes = kpiRepository.findByActivoTrue();
        if (existentes.isEmpty()) {
            return ResponseEntity.ok(inicializarKpisPorDefecto());
        }
        return ResponseEntity.ok(existentes);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @Transactional
    public ResponseEntity<List<ConfiguracionKPI>> actualizarConfiguracion(@RequestBody List<ConfiguracionKPI> nuevasMetas) {
        if (nuevasMetas == null || nuevasMetas.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        log.info("Actualizando {} metas de KPIs institucionales por el Administrador", nuevasMetas.size());
        List<ConfiguracionKPI> guardados = new ArrayList<>();

        for (ConfiguracionKPI meta : nuevasMetas) {
            ConfiguracionKPI entidad = kpiRepository.findByCodigo(meta.getCodigo())
                    .orElse(ConfiguracionKPI.builder()
                            .codigo(meta.getCodigo())
                            .build());

            entidad.setTitulo(meta.getTitulo());
            entidad.setMetaValor(meta.getMetaValor());
            entidad.setUnidad(meta.getUnidad());
            entidad.setComparador(meta.getComparador());
            entidad.setFormula(meta.getFormula());
            entidad.setDescripcion(meta.getDescripcion());
            entidad.setActivo(meta.getActivo() != null ? meta.getActivo() : true);

            guardados.add(kpiRepository.save(entidad));
        }

        return ResponseEntity.ok(guardados);
    }

    private List<ConfiguracionKPI> inicializarKpisPorDefecto() {
        List<ConfiguracionKPI> porDefecto = List.of(
                ConfiguracionKPI.builder()
                        .codigo("KPI-01")
                        .titulo("Cumplimiento SLA Global")
                        .metaValor(95.0)
                        .unidad("%")
                        .comparador("≥")
                        .formula("(tickets resueltos a tiempo / tickets cerrados) × 100")
                        .descripcion("Porcentaje de tickets atendidos dentro del tiempo comprometido.")
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-02")
                        .titulo("Tickets Abiertos en Cola")
                        .metaValor(30.0)
                        .unidad("casos")
                        .comparador("≤")
                        .formula("Total de tickets en estado NUEVO, ASIGNADO y EN_PROCESO")
                        .descripcion("Total de solicitudes e incidentes activos pendientes de atención técnica.")
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-03")
                        .titulo("Tiempo Prom. Respuesta (TPR)")
                        .metaValor(20.0)
                        .unidad("min")
                        .comparador("≤")
                        .formula("Σ(hora asignación − hora registro) / tickets atendidos")
                        .descripcion("Tiempo promedio que demora el equipo de TI en tomar el ticket tras ser reportado.")
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-04")
                        .titulo("Resueltos en el Turno")
                        .metaValor(150.0)
                        .unidad("casos")
                        .comparador("≥")
                        .formula("Total tickets en estado RESUELTO o CERRADO")
                        .descripcion("Cantidad de casos solucionados satisfactoriamente.")
                        .activo(true)
                        .build()
        );

        return kpiRepository.saveAll(porDefecto);
    }
}
