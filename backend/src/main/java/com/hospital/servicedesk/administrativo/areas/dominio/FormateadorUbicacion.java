package com.hospital.servicedesk.administrativo.areas.dominio;

import org.springframework.stereotype.Component;

/**
 * Componente de dominio para la representación legible de pisos y ubicaciones hospitalarias.
 */
@Component
public class FormateadorUbicacion {

    public String legible(Integer piso) {
        if (piso == null) {
            return null;
        }

        return switch (piso) {
            case 0 -> "Sótano";
            case 1 -> "Primer Piso";
            case 2 -> "Segundo Piso";
            case 3 -> "Tercer Piso";
            case 4 -> "Cuarto Piso";
            case 5 -> "Quinto Piso";
            case 6 -> "Sexto Piso";
            case 7 -> "Séptimo Piso";
            case 8 -> "Octavo Piso";
            case 9 -> "Noveno Piso";
            case 10 -> "Décimo Piso";
            default -> (piso < 0) ? "Subsuelo " + Math.abs(piso) : "Piso " + piso;
        };
    }

    /**
     * Intenta extraer el número de piso a partir de una cadena heterogénea.
     */
    public Integer extraerNumeroPiso(String textoPiso) {
        if (textoPiso == null || textoPiso.isBlank()) {
            return null;
        }
        String limpio = textoPiso.trim().toLowerCase();
        if (limpio.contains("sotano") || limpio.contains("sótano")) {
            return 0;
        }
        try {
            // Si viene directamente el número "1", "2"
            return Integer.parseInt(limpio.replaceAll("[^0-9-]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
