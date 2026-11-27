package com.hospital.servicedesk.entities;

import lombok.Getter;

@Getter
public enum EstadoCambio {
    BORRADOR("Borrador"),
    EN_EVALUACION("En evaluación"),
    APROBADO("Aprobado"),
    RECHAZADO("Rechazado"),
    EN_EJECUCION("En ejecución"),
    IMPLEMENTADO("Implementado"),
    CANCELADO("Cancelado");

    private final String etiqueta;

    EstadoCambio(String etiqueta) { this.etiqueta = etiqueta; }

    public boolean esTerminal() {
        return this == RECHAZADO || this == IMPLEMENTADO || this == CANCELADO;
    }
}
