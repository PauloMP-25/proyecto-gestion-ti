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

    @Column(name = "unidad", nullable = false, length = 10)
    private String unidad;

    @Column(name = "comparador", nullable = false, length = 5)
    private String comparador;

    @Column(name = "formula", length = 200)
    private String formula;

    @Column(name = "descripcion", length = 300)
    private String descripcion;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
