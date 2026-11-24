package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasoSolucion {

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "advertencia", length = 300)
    private String advertencia;
}
