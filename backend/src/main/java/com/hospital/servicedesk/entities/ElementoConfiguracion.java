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
@Table(name = "elemento_configuracion")
public class ElementoConfiguracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ci")
    private Integer idCi;

    @Column(name = "codigo_inventario", length = 30, unique = true)
    private String codigoInventario;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_ci", nullable = false, length = 30)
    private TipoCI tipoCi;

    @Column(name = "marca_modelo", length = 100)
    private String marcaModelo;

    @Column(name = "hostname", length = 100)
    private String hostname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_area", nullable = false)
    private Area area;

    @Column(name = "referencia_ubicacion", length = 150)
    private String referenciaUbicacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoCI estado = EstadoCI.ACTIVO;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;
}
