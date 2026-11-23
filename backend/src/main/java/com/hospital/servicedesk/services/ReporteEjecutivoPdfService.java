package com.hospital.servicedesk.services;

import java.time.LocalDateTime;

public interface ReporteEjecutivoPdfService {
    byte[] generarReporteEjecutivoPdf(LocalDateTime fechaInicio, LocalDateTime fechaFin, String username);
}
