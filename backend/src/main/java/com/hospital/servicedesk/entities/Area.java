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
@Table(name = "area")
public class Area {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_area")
    private Integer idArea;

    @Column(name = "nombre", nullable = false, length = 80, unique = true)
    private String nombre;

    @Column(name = "piso", length = 30)
    private String piso;

    @Column(name = "referencia_ubicacion", length = 150)
    private String referenciaUbicacion;

    @Column(name = "anexo", length = 20)
    private String anexo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_encargado")
    private Usuario encargado;

    @Builder.Default
    @Column(name = "prioridad_defecto", length = 20)
    private String prioridadDefecto = "P3";

    @Builder.Default
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
}
