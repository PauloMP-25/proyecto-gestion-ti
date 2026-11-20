package com.hospital.servicedesk.administrativo.equipos.dto;

import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;

public record EquipoResumen(
        Integer id,
        String codigoInventario,
        String nombre,
        TipoCI tipo,
        String hostname,
        String ipVigente,
        EstadoCI estado,
        Integer idArea,
        String nombreArea,
        String referenciaUbicacion,
        String marcaModelo
) {}
