package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "guia_voto", uniqueConstraints = @UniqueConstraint(name = "UQ_guia_voto_usuario",
        columnNames = {"id_error", "id_usuario"}))
public class VotoGuia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_voto")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_error", nullable = false)
    private ErrorConocido guia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "es_util", nullable = false)
    private boolean esUtil;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
