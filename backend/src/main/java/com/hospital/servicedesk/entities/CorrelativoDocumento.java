package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "correlativo_documento")
public class CorrelativoDocumento {

    @Id
    @Column(name = "clave", length = 30)
    private String clave;

    @Column(name = "ultimo", nullable = false)
    private Integer ultimo;
}
