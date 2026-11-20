package com.hospital.servicedesk.administrativo.areas.dto;

import jakarta.validation.constraints.NotNull;

public record CambioEstadoSolicitud(
        @NotNull(message = "El estado activo es obligatorio")
        Boolean activo
) {}
