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
        List<ConfiguracionKPI> existentes = kpiRepository.findAllByOrderByOrdenAsc();
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

        log.info("Actualizando {} metas y visibilidad de KPIs institucionales por el Administrador", nuevasMetas.size());
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
            entidad.setNumeradorFormula(meta.getNumeradorFormula());
            entidad.setDenominadorFormula(meta.getDenominadorFormula());
            entidad.setMultiplicadorFormula(meta.getMultiplicadorFormula());
            entidad.setEsFraccion(meta.getEsFraccion() != null ? meta.getEsFraccion() : true);
            entidad.setDescripcion(meta.getDescripcion());
            entidad.setOrden(meta.getOrden() != null ? meta.getOrden() : 1);
            entidad.setActivo(meta.getActivo() != null ? meta.getActivo() : true);

            guardados.add(kpiRepository.save(entidad));
        }

        return ResponseEntity.ok(guardados);
    }

    private List<ConfiguracionKPI> inicializarKpisPorDefecto() {
        List<ConfiguracionKPI> porDefecto = List.of(
                ConfiguracionKPI.builder()
                        .codigo("KPI-01")
                        .titulo("Cumplimiento de SLA")
                        .metaValor(90.0)
                        .unidad("%")
                        .comparador("≥")
                        .numeradorFormula("Total de tickets resueltos a tiempo")
                        .denominadorFormula("Total de tickets cerrados")
                        .multiplicadorFormula("× 100")
                        .esFraccion(true)
                        .formula("(Total de tickets resueltos a tiempo / Total de tickets cerrados) × 100")
                        .descripcion("Porcentaje de incidentes y solicitudes resueltos dentro de los plazos de atención.")
                        .orden(1)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-02")
                        .titulo("Tiempo Promedio de Respuesta (TPR)")
                        .metaValor(20.0)
                        .unidad("min")
                        .comparador("≤")
                        .numeradorFormula("∑ (Hora de Asignación − Hora de Registro)")
                        .denominadorFormula("Total de tickets atendidos")
                        .multiplicadorFormula(null)
                        .esFraccion(true)
                        .formula("∑ (Hora Asignación − Hora Registro) / Total tickets atendidos")
                        .descripcion("Agilidad con la que el equipo de soporte toma contacto y asigna un responsable.")
                        .orden(2)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-03")
                        .titulo("Tiempo Promedio de Resolución (MTTR)")
                        .metaValor(180.0)
                        .unidad("min")
                        .comparador("≤")
                        .numeradorFormula("∑ (Hora de Resolución − Hora de Registro)")
                        .denominadorFormula("Total de tickets resueltos")
                        .multiplicadorFormula(null)
                        .esFraccion(true)
                        .formula("∑ (Hora Resolución − Hora Registro) / Total tickets resueltos")
                        .descripcion("Duración total que demanda solucionar un incidente desde su reporte inicial.")
                        .orden(3)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-04")
                        .titulo("Resolución en Primer Contacto (FCR)")
                        .metaValor(65.0)
                        .unidad("%")
                        .comparador("≥")
                        .numeradorFormula("Tickets resueltos por N1 en 1.er contacto")
                        .denominadorFormula("Total de tickets atendidos por N1")
                        .multiplicadorFormula("× 100")
                        .esFraccion(true)
                        .formula("(Tickets resueltos en 1.er contacto / Total atendidos N1) × 100")
                        .descripcion("Eficiencia del soporte N1 para solucionar incidentes rutinarios sin escalarlos.")
                        .orden(4)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-05")
                        .titulo("Incidentes Recurrentes")
                        .metaValor(10.0)
                        .unidad("casos")
                        .comparador("≤")
                        .numeradorFormula(null)
                        .denominadorFormula(null)
                        .multiplicadorFormula(null)
                        .esFraccion(false)
                        .formula("Conteo total de tickets asociados a un mismo Error Conocido (KEDB)")
                        .descripcion("Aparición repetitiva de fallas similares enfocadas en la Gestión de Problemas.")
                        .orden(5)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-06")
                        .titulo("Disponibilidad del Servicio Crítico")
                        .metaValor(99.5)
                        .unidad("%")
                        .comparador("≥")
                        .numeradorFormula("Tiempo total período − Tiempo indisponibilidad")
                        .denominadorFormula("Tiempo total del período")
                        .multiplicadorFormula("× 100")
                        .esFraccion(true)
                        .formula("((Tiempo total − Tiempo indisponibilidad) / Tiempo total) × 100")
                        .descripcion("Porcentaje de tiempo operativo de los sistemas asistenciales clave y la red LAN.")
                        .orden(6)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-07")
                        .titulo("Satisfacción del Usuario")
                        .metaValor(85.0)
                        .unidad("%")
                        .comparador("≥")
                        .numeradorFormula("Encuestas con calificación positiva")
                        .denominadorFormula("Total de encuestas respondidas")
                        .multiplicadorFormula("× 100")
                        .esFraccion(true)
                        .formula("(Encuestas con calificación positiva / Total encuestas) × 100")
                        .descripcion("Percepción del personal médico y asistencial respecto a la calidad del soporte.")
                        .orden(7)
                        .activo(true)
                        .build(),
                ConfiguracionKPI.builder()
                        .codigo("KPI-08")
                        .titulo("Solicitudes Activas en Cola")
                        .metaValor(30.0)
                        .unidad("casos")
                        .comparador("≤")
                        .numeradorFormula(null)
                        .denominadorFormula(null)
                        .multiplicadorFormula(null)
                        .esFraccion(false)
                        .formula("Total tickets en estado NUEVO, ASIGNADO y EN PROCESO")
                        .descripcion("Volumen de solicitudes e incidentes activos pendientes de atención técnica.")
                        .orden(8)
                        .activo(true)
                        .build()
        );

        return kpiRepository.saveAll(porDefecto);
    }
}
