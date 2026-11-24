package com.hospital.servicedesk.dtos;

import java.util.List;

public class DashboardDTOs {

    public record SerieDatoDTO(
            String etiqueta,
            long valor,
            double porcentaje
    ) {}

    public record CargaTurnosDTO(
            List<String> dias,
            List<Long> turnoManana,
            List<Long> turnoTarde,
            List<Long> totales
    ) {}

    public record InventarioEstadoDTO(
            long total,
            long enServicio,
            long enPrestamo,
            long enMantenimiento,
            long disponiblesReserva
    ) {}

    public record DashboardRespuestaDTO(
            long totalTickets,
            long ticketsAbiertos,
            long ticketsResueltos,
            double cumplimientoSlaPorcentaje,
            double tiempoPromedioRespuestaMinutos,
            List<SerieDatoDTO> incidentesPorArea,
            List<SerieDatoDTO> fallasPorActivo,
            CargaTurnosDTO cargaTurnos,
            InventarioEstadoDTO inventarioEquipos
    ) {}
}
