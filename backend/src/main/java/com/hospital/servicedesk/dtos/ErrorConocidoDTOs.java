package com.hospital.servicedesk.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class ErrorConocidoDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorConocidoRequest {
        @NotBlank(message = "El título es obligatorio")
        private String titulo;

        @NotBlank(message = "La descripción del problema es obligatoria")
        private String descripcionProblema;

        @NotBlank(message = "La solución de trabajo es obligatoria")
        private String solucionTrabajo;

        private Boolean publicado;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorConocidoResponse {
        private Integer idError;
        private String titulo;
        private String descripcionProblema;
        private String solucionTrabajo;
        private Boolean publicado;
        private LocalDateTime fechaCreacion;
    }
}
