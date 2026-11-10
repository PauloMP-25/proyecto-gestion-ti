
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ticket")
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ticket")
    private Integer idTicket;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoTicket tipo;

    @Column(name = "asunto", nullable = false, length = 150)
    private String asunto;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "impacto", nullable = false, length = 20)
    private Impacto impacto;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgencia", nullable = false, length = 20)
    private Urgencia urgencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridad", nullable = false, length = 20)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private EstadoTicket estado = EstadoTicket.ABIERTO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_area", nullable = false)
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ci")
    private ElementoConfiguracion elementoConfiguracion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_reporta")
    private Usuario usuarioReporta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tecnico_asignado")
    private Usuario tecnicoAsignado;

    @Column(name = "ip_origen", length = 15)
    private String ipOrigen;

    @Column(name = "fecha_creacion", nullable = false)
    @Builder.Default
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_limite_resolucion")
    private LocalDateTime fechaLimiteResolucion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_sla", length = 30)
    @Builder.Default
    private EstadoSLA estadoSla = EstadoSLA.DENTRO_TIEMPO;
}

