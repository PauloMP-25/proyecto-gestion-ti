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
@Table(name = "direccion_ip")
public class DireccionIP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_direccion_ip")
    private Integer idDireccionIp;

    @Column(name = "direccion", nullable = false, unique = true, length = 15)
    private String direccion;

    @Column(name = "subred", length = 50)
    private String subred;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoIP estado = EstadoIP.DISPONIBLE;
}
