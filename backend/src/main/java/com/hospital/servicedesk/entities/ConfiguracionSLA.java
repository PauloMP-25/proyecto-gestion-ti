package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "configuracion_sla")
public class ConfiguracionSLA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion")
    private Integer idConfiguracion;

    @Column(name = "impacto", nullable = false, length = 10)
    private String impacto;

    @Column(name = "urgencia", nullable = false, length = 10)
    private String urgencia;

    @Column(name = "prioridad_resultante", nullable = false, length = 10)
    private String prioridadResultante;

    @Column(name = "minutos_respuesta", nullable = false)
    private Integer minutosRespuesta;

    @Column(name = "minutos_resolucion", nullable = false)
    private Integer minutosResolucion;
}
