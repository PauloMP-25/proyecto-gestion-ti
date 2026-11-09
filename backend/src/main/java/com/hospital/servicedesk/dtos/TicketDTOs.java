package com.hospital.servicedesk.dtos;

import com.hospital.servicedesk.entities.Impacto;
import com.hospital.servicedesk.entities.TipoTicket;
import com.hospital.servicedesk.entities.Urgencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class TicketDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateTicketRequest {
        @NotNull(message = "El tipo de ticket es obligatorio")
        private TipoTicket tipo;

        @NotBlank(message = "El asunto es obligatorio")
        private String asunto;

        @NotBlank(message = "La descripción es obligatoria")
        private String descripcion;

        @NotNull(message = "El impacto es obligatorio")
        private Impacto impacto;

        @NotNull(message = "La urgencia es obligatoria")
        private Urgencia urgencia;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignRequest {
        @NotNull(message = "El ID del técnico es obligatorio")
        private Integer tecnicoId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResolveRequest {
        @NotBlank(message = "El detalle de la solución es obligatorio")
        private String solucion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistorialTicketResponse {
        private Integer idHistorial;
        private String usuarioNombre;
        private String accion;
        private String detalle;
        private LocalDateTime fechaAccion;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketResponse {
        private Integer idTicket;
        private TipoTicket tipo;
        private String asunto;
        private String descripcion;
        private String impacto;
        private String urgencia;
        private String prioridad;
        private String estado;
        private String areaNombre;
        private String ciNombre;
        private String ipOrigen;
        private LocalDateTime fechaCreacion;
        private LocalDateTime fechaLimiteResolucion;
        private String estadoSla;
    }


}
