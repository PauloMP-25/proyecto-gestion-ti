package com.hospital.servicedesk.entities;

public enum ImpactoAsistencial {
    BAJO, MEDIO, ALTO, CRITICO;
    public boolean exigeContinuidad() { return this == ALTO || this == CRITICO; }
}
