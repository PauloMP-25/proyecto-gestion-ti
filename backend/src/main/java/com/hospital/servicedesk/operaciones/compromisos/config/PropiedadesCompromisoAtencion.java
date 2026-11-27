package com.hospital.servicedesk.operaciones.compromisos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties(prefix = "servicedesk.compromisos")
public record PropiedadesCompromisoAtencion(
        @DefaultValue("true") boolean monitorHabilitado,
        @DefaultValue("60000") long intervaloMs,
        @DefaultValue("0.70") double umbralRiesgo,
        @DefaultValue("200") int tamanoLote,
        @DefaultValue List<String> correosSupervision) {

    public PropiedadesCompromisoAtencion {
        if (umbralRiesgo <= 0 || umbralRiesgo >= 1) {
            throw new IllegalArgumentException("servicedesk.compromisos.umbral-riesgo debe estar entre 0 y 1");
        }
        correosSupervision = correosSupervision == null ? List.of()
                : List.copyOf(correosSupervision);
    }
}
