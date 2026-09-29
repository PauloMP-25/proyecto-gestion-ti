package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "USUARIO")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUsuario")
    private Integer idUsuario;

    @Column(name = "Nombres", nullable = false, length = 80)
    private String nombres;

    @Column(name = "Apellidos", nullable = false, length = 80)
    private String apellidos;

    @Column(name = "Correo", nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "ContrasenaHash", nullable = false)
    private byte[] contrasenaHash;

    @Column(name = "Rol", nullable = false, length = 30)
    private String rol;

    @Column(name = "NivelSoporte", length = 20)
    private String nivelSoporte;

    @Column(name = "IdArea", nullable = false)
    private Integer idArea;

    @Column(name = "Activo", nullable = false)
    private Boolean activo;

    @Column(name = "FechaCreacion", nullable = false)
    private LocalDateTime fechaCreacion;
}