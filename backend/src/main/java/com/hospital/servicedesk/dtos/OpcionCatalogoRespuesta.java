package com.hospital.servicedesk.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO inmutable para opciones de catálogos seleccionables en el frontend (Dropdowns / Selects).
 */
public record OpcionCatalogoRespuesta(
        @JsonProperty("codigo") String codigo,
        @JsonProperty("prefijo") String prefijo,
        @JsonProperty("descripcion") String descripcion,
        @JsonProperty("orden") int orden
) {}
