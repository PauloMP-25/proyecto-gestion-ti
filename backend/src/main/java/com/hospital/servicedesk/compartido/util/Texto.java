package com.hospital.servicedesk.compartido.util;

/**
 * Funciones puras de utilidad para saneamiento y normalización de cadenas de texto.
 */
public final class Texto {

    private Texto() {}

    /**
     * Elimina espacios al inicio y final y colapsa secuencias de espacios múltiples a uno solo.
     */
    public static String normalizar(String texto) {
        if (texto == null) {
            return null;
        }
        String recortado = texto.trim();
        return recortado.replaceAll("\\s+", " ");
    }

    /**
     * Retorna null si la cadena es nula o está vacía (o solo contiene espacios).
     */
    public static String vacioANulo(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }
        return texto.trim();
    }
}
