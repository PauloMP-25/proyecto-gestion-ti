package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad para la calibración y configuración dinámica de metas de KPIs
 * hospitalarios del Service Desk HSMSI por parte del Administrador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "configuracion_kpi")
public class ConfiguracionKPI {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_kpi")
    private Integer idKpi;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(name = "titulo", nullable = false, length = 100)
    private String titulo;

    @Column(name = "meta_valor", nullable = false)
    private Double metaValor;

    @Column(name = "unidad", nullable = false, length = 15)
    private String unidad;

    @Column(name = "comparador", nullable = false, length = 10, columnDefinition = "nvarchar(10)")
    private String comparador;

    @Column(name = "formula", length = 300)
    private String formula;

    @Column(name = "numerador_formula", length = 200)
    private String numeradorFormula;

    @Column(name = "denominador_formula", length = 200)
    private String denominadorFormula;

    @Column(name = "multiplicador_formula", length = 50)
    private String multiplicadorFormula;

    @Column(name = "es_fraccion")
    @Builder.Default
    private Boolean esFraccion = true;

    @Column(name = "descripcion", length = 350)
    private String descripcion;

    @Column(name = "orden")
    @Builder.Default
    private Integer orden = 1;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
