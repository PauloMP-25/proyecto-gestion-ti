package com.hospital.servicedesk.asistencial.atencion.dto;

import com.hospital.servicedesk.administrativo.areas.dto.AreaMini;
import com.hospital.servicedesk.administrativo.areas.dto.PersonaResumen;
import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.entities.TipoCI;

import java.util.List;

/**
 * DTO inmutable con la resolución del contexto asistencial del usuario reportante.
 */
public record ContextoAtencionRespuesta(
        EstadoDeteccion estadoDeteccion,
        String ipOrigen,
        EquipoContextoRespuesta equipo,
        AreaContextoRespuesta area,
        List<ImpresoraAreaRespuesta> impresorasArea,
        PersonaContextoRespuesta persona,
        boolean personaEnOtraArea
) {
    public ContextoAtencionRespuesta {
        impresorasArea = impresorasArea == null ? List.of() : List.copyOf(impresorasArea);
    }

    public record EquipoContextoRespuesta(
            Integer id,
            String codigoInventario,
            String nombre,
            TipoCI tipo,
            String referenciaUbicacion
    ) {}

    public record AreaContextoRespuesta(
            Integer id,
            String nombre,
            String ubicacionLegible,
            String referenciaUbicacion,
            String anexo,
            PersonaResumen encargado
    ) {}

    public record ImpresoraAreaRespuesta(
            Integer id,
            String codigoInventario,
            String nombre,
            String referenciaUbicacion,
            String ipEstatica
    ) {}

    public record PersonaContextoRespuesta(
            Integer id,
            String nombreVisible,
            String grado,
            AreaMini areaAdscrita
    ) {}
}
