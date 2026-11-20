package com.hospital.servicedesk.administrativo.areas.mapper;

import com.hospital.servicedesk.administrativo.areas.dominio.FormateadorUbicacion;
import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaMini;
import com.hospital.servicedesk.administrativo.areas.dto.AreaResumen;
import com.hospital.servicedesk.administrativo.areas.dto.AreaSolicitud;
import com.hospital.servicedesk.administrativo.areas.dto.PersonaResumen;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.Usuario;
import org.springframework.stereotype.Component;

/**
 * Mapper puro para la entidad Area y sus correspondientes contratos DTO inmutables.
 */
@Component
public class AreaMapper {

    private final FormateadorUbicacion formateadorUbicacion;

    public AreaMapper(FormateadorUbicacion formateadorUbicacion) {
        this.formateadorUbicacion = formateadorUbicacion;
    }

    public AreaResumen aResumen(Area a, long totalPersonal, long totalComputadoras, long totalImpresoras) {
        if (a == null) return null;
        Integer numPiso = formateadorUbicacion.extraerNumeroPiso(a.getPiso());
        return new AreaResumen(
                a.getIdArea(),
                a.getNombre(),
                numPiso,
                formateadorUbicacion.legible(numPiso),
                a.getAnexo(),
                aPersonaResumen(a.getEncargado()),
                Boolean.TRUE.equals(a.getActivo()),
                totalPersonal,
                totalComputadoras,
                totalImpresoras
        );
    }

    public AreaDetalle aDetalle(Area a, long totalPersonal, long totalComputadoras, long totalImpresoras) {
        if (a == null) return null;
        Integer numPiso = formateadorUbicacion.extraerNumeroPiso(a.getPiso());
        return new AreaDetalle(
                a.getIdArea(),
                a.getNombre(),
                numPiso,
                formateadorUbicacion.legible(numPiso),
                a.getReferenciaUbicacion(),
                a.getAnexo(),
                aPersonaResumen(a.getEncargado()),
                Boolean.TRUE.equals(a.getActivo()),
                totalPersonal,
                totalComputadoras,
                totalImpresoras
        );
    }

    public AreaMini aMini(Area a) {
        if (a == null) return null;
        return new AreaMini(a.getIdArea(), a.getNombre());
    }

    public PersonaResumen aPersonaResumen(Usuario u) {
        if (u == null) return null;
        return new PersonaResumen(u.getIdUsuario(), u.getNombreVisible());
    }

    public Area aNuevaEntidad(AreaSolicitud s, Usuario encargado) {
        return Area.builder()
                .nombre(s.nombre())
                .piso(s.piso() != null ? String.valueOf(s.piso()) : null)
                .referenciaUbicacion(s.referenciaUbicacion())
                .anexo(s.anexo())
                .encargado(encargado)
                .activo(true)
                .build();
    }

    public void aplicar(AreaSolicitud s, Area a, Usuario encargado) {
        a.setNombre(s.nombre());
        a.setPiso(s.piso() != null ? String.valueOf(s.piso()) : null);
        a.setReferenciaUbicacion(s.referenciaUbicacion());
        a.setAnexo(s.anexo());
        a.setEncargado(encargado);
    }
}
