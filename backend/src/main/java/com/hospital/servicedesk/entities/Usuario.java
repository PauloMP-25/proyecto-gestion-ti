package com.hospital.servicedesk.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "grado_profesional", length = 20)
    @Builder.Default
    private GradoProfesional gradoProfesional = GradoProfesional.SIN_GRADO;

    @Column(name = "nombre_usuario", length = 50, unique = true)
    private String nombreUsuario;

    @Column(name = "nombres", nullable = false, length = 80)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 80)
    private String apellidos;

    @Column(name = "correo", nullable = false, unique = true, length = 100)
    private String correo;

    @JsonIgnore
    @Column(name = "contrasena_hash", nullable = false)
    private byte[] contrasenaHash;

    @Column(name = "rol", nullable = false, length = 30)
    private String rol;

    @Column(name = "nivel_soporte", length = 20)
    private String nivelSoporte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_area", nullable = false)
    private Area area;

    @Builder.Default
    @Column(name = "debe_cambiar_contrasena", nullable = false)
    private Boolean debeCambiarContrasena = false;

    @Builder.Default
    @Column(name = "intentos_fallidos", nullable = false)
    private Integer intentosFallidos = 0;

    @Column(name = "bloqueado_hasta")
    private LocalDateTime bloqueadoHasta;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @Builder.Default
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false, insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /**
     * Devuelve el nombre completo formateado con el grado profesional.
     * Ejemplo: "Lic. Patricia Ramos" o "Carlos Gómez" si no tiene grado.
     */
    @Transient
    public String getNombreVisible() {
        GradoProfesional grado = (gradoProfesional != null) ? gradoProfesional : GradoProfesional.SIN_GRADO;
        return grado.formatear(nombres, apellidos);
    }
}