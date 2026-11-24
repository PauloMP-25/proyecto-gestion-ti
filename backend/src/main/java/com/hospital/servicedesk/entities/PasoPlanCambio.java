package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasoPlanCambio {

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "responsable", length = 120)
    private String responsable;

    @Column(name = "minutos_estimados")
    private Integer minutosEstimados;
}
