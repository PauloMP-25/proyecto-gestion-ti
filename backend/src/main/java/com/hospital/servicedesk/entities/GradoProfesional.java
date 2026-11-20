package com.hospital.servicedesk.entities;

import lombok.Getter;

/**
 * Catálogo enum tipado para grados y títulos profesionales del personal de salud.
 * Garantiza consistencia entre el backend y frontend sin almacenar datos sensibles.
 */
@Getter
public enum GradoProfesional {
    LIC("Lic.", "Licenciado(a)"),
    TEC("Téc.", "Técnico(a)"),
    DR("Dr.", "Doctor"),
    DRA("Dra.", "Doctora"),
    MG("Mg.", "Magíster"),
    ING("Ing.", "Ingeniero(a)"),
    SIN_GRADO("", "Sin grado");

    private final String prefijo;
    private final String descripcion;

    GradoProfesional(String prefijo, String descripcion) {
        this.prefijo = prefijo;
        this.descripcion = descripcion;
    }

    /**
     * Formatea el nombre completo con el prefijo del grado profesional.
     * Ej: "Lic. Patricia Ramos" o "Patricia Ramos" si no tiene grado.
     */
    public String formatear(String nombres, String apellidos) {
        String base = ((nombres != null ? nombres : "") + " " + (apellidos != null ? apellidos : "")).trim();
        if (prefijo == null || prefijo.isBlank()) {
            return base;
        }
        return prefijo + " " + base;
    }
}
