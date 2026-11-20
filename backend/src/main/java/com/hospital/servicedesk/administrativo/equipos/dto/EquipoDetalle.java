package com.hospital.servicedesk.administrativo.equipos.dto;

import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;

import java.util.List;

public record EquipoDetalle(
        Integer id,
        String codigoInventario,
        String nombre,
        TipoCI tipo,
        String hostname,
        String mac,
        String referenciaUbicacion,
        String marcaModelo,
        Integer idArea,
        String nombreArea,
        EstadoCI estado,
        String ipVigente,
        List<HistorialIpResumen> historialIps
) {
    public EquipoDetalle {
        historialIps = historialIps == null ? List.of() : List.copyOf(historialIps);
    }
}
