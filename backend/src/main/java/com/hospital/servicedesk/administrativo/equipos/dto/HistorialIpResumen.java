package com.hospital.servicedesk.administrativo.equipos.dto;

import java.time.LocalDateTime;

public record HistorialIpResumen(
        Integer id,
        String ip,
        LocalDateTime fechaAsignacion,
        LocalDateTime fechaLiberacion,
        boolean activo,
        String asignadoPor
) {}
