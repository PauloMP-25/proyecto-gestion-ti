package com.hospital.servicedesk.administrativo.equipos.dominio.codigo;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Función de dominio pura para derivar abreviaturas de áreas hospitalarias
 * a partir de su nombre descriptivo en tiempo de ejecución.
 * Cero persistencia, determinista y testeable.
 */
public final class AbreviadorNombreArea {

    private static final Set<String> PALABRAS_VACIAS = Set.of(
            "DE", "DEL", "LA", "LAS", "LOS", "EL", "Y", "E", "EN", "PARA", "POR"
    );

    private AbreviadorNombreArea() {}

    /**
     * Deriva una abreviatura alfanumérica de 2 a 4 caracteres para el área.
     * Ejemplos:
     * - "Admisión" -> "ADM"
     * - "Emergencia" -> "EME"
     * - "Consulta Externa" -> "CE"
     * - "Unidad de Cuidados Intensivos" -> "UCI"
     */
    public static String abreviar(String nombreArea) {
        if (nombreArea == null || nombreArea.isBlank()) {
            return "GEN";
        }

        // Quitar tildes y diacríticos
        String limpio = Normalizer.normalize(nombreArea, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9\\s]", " ")
                .trim();

        List<String> palabras = Arrays.stream(limpio.split("\\s+"))
                .filter(p -> !p.isBlank())
                .filter(p -> !PALABRAS_VACIAS.contains(p))
                .collect(Collectors.toList());

        if (palabras.isEmpty()) {
            return "GEN";
        }

        if (palabras.size() == 1) {
            String unica = palabras.get(0);
            return unica.length() <= 3 ? unica : unica.substring(0, 3);
        }

        // Varias palabras: tomar la primera letra de cada una (máximo 4)
        StringBuilder sb = new StringBuilder();
        for (String pal : palabras) {
            if (!pal.isEmpty()) {
                sb.append(pal.charAt(0));
                if (sb.length() == 4) {
                    break;
                }
            }
        }

        return sb.length() >= 2 ? sb.toString() : palabras.get(0).substring(0, Math.min(3, palabras.get(0).length()));
    }
}
