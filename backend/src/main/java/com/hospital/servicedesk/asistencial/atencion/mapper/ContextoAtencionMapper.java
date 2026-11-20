package com.hospital.servicedesk.asistencial.atencion.mapper;

import com.hospital.servicedesk.administrativo.areas.dominio.FormateadorUbicacion;
import com.hospital.servicedesk.administrativo.areas.dto.AreaMini;
import com.hospital.servicedesk.administrativo.areas.dto.PersonaResumen;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.AreaContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.EquipoContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.ImpresoraAreaRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.PersonaContextoRespuesta;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.Usuario;
import org.springframework.stereotype.Component;

/**
 * Mapper puro para contratos de contexto asistencial de atención.
 */
@Component
public class ContextoAtencionMapper {

    private final FormateadorUbicacion formateadorUbicacion;

    public ContextoAtencionMapper(FormateadorUbicacion formateadorUbicacion) {
        this.formateadorUbicacion = formateadorUbicacion;
    }

    public EquipoContextoRespuesta aEquipoRespuesta(ElementoConfiguracion eq) {
        if (eq == null) return null;
        return new EquipoContextoRespuesta(
                eq.getIdCi(),
                eq.getCodigoInventario(),
                eq.getNombre(),
                eq.getTipoCi(),
                eq.getReferenciaUbicacion()
        );
    }

    public AreaContextoRespuesta aAreaRespuesta(Area a) {
        if (a == null) return null;
        Integer numPiso = formateadorUbicacion.extraerNumeroPiso(a.getPiso());
        PersonaResumen encargado = a.getEncargado() != null
                ? new PersonaResumen(a.getEncargado().getIdUsuario(), a.getEncargado().getNombreVisible())
                : null;

        return new AreaContextoRespuesta(
                a.getIdArea(),
                a.getNombre(),
                formateadorUbicacion.legible(numPiso),
                a.getReferenciaUbicacion(),
                a.getAnexo(),
                encargado
        );
    }

    public ImpresoraAreaRespuesta aImpresoraRespuesta(ElementoConfiguracion imp, String ipEstatica) {
        if (imp == null) return null;
        return new ImpresoraAreaRespuesta(
                imp.getIdCi(),
                imp.getCodigoInventario(),
                imp.getNombre(),
                imp.getReferenciaUbicacion(),
                ipEstatica
        );
    }

    public PersonaContextoRespuesta aPersonaRespuesta(Usuario u) {
        if (u == null) return null;
        AreaMini areaAdscrita = u.getArea() != null
                ? new AreaMini(u.getArea().getIdArea(), u.getArea().getNombre())
                : null;
        String grado = u.getGradoProfesional() != null ? u.getGradoProfesional().name() : "SIN_GRADO";

        return new PersonaContextoRespuesta(
                u.getIdUsuario(),
                u.getNombreVisible(),
                grado,
                areaAdscrita
        );
    }
}
