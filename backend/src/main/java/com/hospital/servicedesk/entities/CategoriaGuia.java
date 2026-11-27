package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum CategoriaGuia {
    SISTEMA_CLINICO(1, "Sistema clínico (HIS)"),
    IMPRESORAS_TERMICAS(2, "Impresoras de etiquetas y térmicas"),
    REDES(3, "Redes y conectividad"),
    HARDWARE(4, "Hardware y periféricos"),
    SOFTWARE_ASISTENCIAL(5, "Software asistencial");

    private final int id;
    private final String etiqueta;

    CategoriaGuia(int id, String etiqueta) { this.id = id; this.etiqueta = etiqueta; }

    public static CategoriaGuia desdeId(Integer id) {
        return Arrays.stream(values()).filter(c -> id != null && c.id == id).findFirst()
                .orElseThrow(() -> new com.hospital.servicedesk.exceptions.ReglaNegocioException(
                        "categoriaId", "Seleccione una categoría válida."));
    }
}
