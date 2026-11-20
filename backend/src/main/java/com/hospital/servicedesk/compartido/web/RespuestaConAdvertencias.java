package com.hospital.servicedesk.compartido.web;

import java.util.List;

/**
 * Envoltorio para respuestas de mutación exitosa que además informan advertencias no bloqueantes.
 */
public record RespuestaConAdvertencias<T>(
        T datos,
        List<String> advertencias
) {
    public RespuestaConAdvertencias {
        advertencias = advertencias == null ? List.of() : List.copyOf(advertencias);
    }

    public static <T> RespuestaConAdvertencias<T> sinAdvertencias(T datos) {
        return new RespuestaConAdvertencias<>(datos, List.of());
    }

    public static <T> RespuestaConAdvertencias<T> conAdvertencia(T datos, String advertencia) {
        return new RespuestaConAdvertencias<>(datos, List.of(advertencia));
    }
}
