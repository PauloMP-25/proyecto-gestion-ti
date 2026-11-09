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
@Table(name = "historial_asignacion_ip")
public class HistorialAsignacionIP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial_ip")
    private Integer idHistorialIp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_direccion_ip", nullable = false)
    private DireccionIP direccionIp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ci", nullable = false)
    private ElementoConfiguracion elementoConfiguracion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_asigno", nullable = false)
    private Usuario usuarioAsigno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_libero")
    private Usuario usuarioLibero;

    @Column(name = "fecha_asignacion", nullable = false, insertable = false, updatable = false)
    private LocalDateTime fechaAsignacion;

    @Column(name = "fecha_liberacion")
    private LocalDateTime fechaLiberacion;
}
