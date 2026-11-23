package com.hospital.servicedesk.administrativo.equipos.mapper;

import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoSolicitud;
import com.hospital.servicedesk.administrativo.equipos.dto.HistorialIpResumen;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper puro para elementos de configuración (Equipos) e historial de direccionamiento IP.
 */
@Component
public class EquipoMapper {

    public EquipoResumen aResumen(ElementoConfiguracion eq, String ipVigente) {
        if (eq == null) return null;
        return new EquipoResumen(
                eq.getIdCi(),
                eq.getCodigoInventario(),
                eq.getNombre(),
                eq.getTipoCi(),
                eq.getHostname(),
                ipVigente,
                eq.getEstado(),
                eq.getArea() != null ? eq.getArea().getIdArea() : null,
                eq.getArea() != null ? eq.getArea().getNombre() : null,
                eq.getReferenciaUbicacion(),
                eq.getMarcaModelo()
        );
    }

    public EquipoDetalle aDetalle(ElementoConfiguracion eq, String ipVigente, List<HistorialAsignacionIP> historial) {
        if (eq == null) return null;
        List<HistorialIpResumen> historialDtos = historial == null ? List.of() :
                historial.stream().map(this::aHistorialResumen).toList();

        return new EquipoDetalle(
                eq.getIdCi(),
                eq.getCodigoInventario(),
                eq.getNombre(),
                eq.getTipoCi(),
                eq.getHostname(),
                eq.getReferenciaUbicacion(),
                eq.getMarcaModelo(),
                eq.getArea() != null ? eq.getArea().getIdArea() : null,
                eq.getArea() != null ? eq.getArea().getNombre() : null,
                eq.getEstado(),
                ipVigente,
                historialDtos
        );
    }

    public HistorialIpResumen aHistorialResumen(HistorialAsignacionIP h) {
        if (h == null) return null;
        String asignadoPor = h.getUsuarioAsigno() != null ? h.getUsuarioAsigno().getNombreVisible() : "Sistema";
        return new HistorialIpResumen(
                h.getIdHistorialIp(),
                h.getDireccionIp() != null ? h.getDireccionIp().getDireccion() : null,
                h.getFechaAsignacion(),
                h.getFechaLiberacion(),
                h.getFechaLiberacion() == null,
                asignadoPor
        );
    }

    public ElementoConfiguracion aNuevaEntidad(EquipoSolicitud s, Area area) {
        return ElementoConfiguracion.builder()
                .tipoCi(s.tipo())
                .codigoInventario(s.codigoInventario())
                .nombre(s.nombre())
                .hostname(s.hostname())
                .referenciaUbicacion(s.referenciaUbicacion())
                .marcaModelo(s.marcaModelo())
                .area(area)
                .estado(EstadoCI.ACTIVO)
                .build();
    }

    public void aplicar(EquipoSolicitud s, ElementoConfiguracion eq, Area area) {
        eq.setTipoCi(s.tipo());
        eq.setCodigoInventario(s.codigoInventario());
        eq.setNombre(s.nombre());
        eq.setHostname(s.hostname());
        eq.setReferenciaUbicacion(s.referenciaUbicacion());
        eq.setMarcaModelo(s.marcaModelo());
        eq.setArea(area);
    }
}
