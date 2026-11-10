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
@Table(name = "escalamiento")
public class Escalamiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_escalamiento")
    private Integer idEscalamiento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private Ticket ticket;

    @Column(name = "nivel_origen", nullable = false, length = 20)
    private String nivelOrigen;

    @Column(name = "nivel_destino", nullable = false, length = 20)
    private String nivelDestino;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_origen", nullable = false)
    private Usuario usuarioOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_destino")
    private Usuario usuarioDestino;

    @Column(name = "motivo", nullable = false, length = 300)
    private String motivo;

    @Column(name = "fecha_escalamiento", nullable = false, insertable = false, updatable = false)
    private LocalDateTime fechaEscalamiento;
}
