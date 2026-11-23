package com.hospital.servicedesk.administrativo.areas.dto;

public record AreaResumen(
        Integer id,
        String nombre,
        Integer piso,
        String ubicacionLegible,
        String anexo,
        PersonaResumen encargado,
        boolean activo,
        long totalPersonal,
        long totalComputadoras,
        long totalImpresoras,
        String prioridadDefecto
) {}
