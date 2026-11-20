package com.hospital.servicedesk.asistencial.atencion.dominio.objetivo;

import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.EquipoContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.ImpresoraAreaRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.entities.Impacto;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.entities.TipoTicket;
import com.hospital.servicedesk.entities.Urgencia;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResolutorObjetivoFallaTest {

    private final ObjetivoEquipoActual resolutorEquipo = new ObjetivoEquipoActual();
    private final ObjetivoImpresoraArea resolutorImpresora = new ObjetivoImpresoraArea();
    private final ObjetivoOtro resolutorOtro = new ObjetivoOtro();

    @Test
    @DisplayName("ObjetivoEquipoActual: debe resolver el id del equipo si el contexto está DETECTADO")
    void debeResolverEquipoActualDetectado() {
        EquipoContextoRespuesta equipo = new EquipoContextoRespuesta(15, "PC-ADM-01", "PC Admisión", TipoCI.COMPUTADORA, null);
        ContextoAtencionRespuesta ctx = new ContextoAtencionRespuesta(
                EstadoDeteccion.DETECTADO, "192.168.10.12", equipo, null, List.of(), null, false);

        ReportarProblemaSolicitud sol = new ReportarProblemaSolicitud(
                TipoTicket.INCIDENTE, "Falla teclado", "Teclas no responden",
                Impacto.MEDIO, Urgencia.MEDIA, ObjetivoFalla.EQUIPO_ACTUAL, null, null);

        Integer idCi = resolutorEquipo.resolverEquipoAfectado(sol, ctx);
        assertThat(idCi).isEqualTo(15);
    }

    @Test
    @DisplayName("ObjetivoEquipoActual: debe lanzar ReglaNegocioException si no se detectó equipo")
    void debeFallarSiEquipoNoDetectado() {
        ContextoAtencionRespuesta ctx = new ContextoAtencionRespuesta(
                EstadoDeteccion.IP_NO_REGISTRADA, "192.168.99.1", null, null, List.of(), null, false);

        ReportarProblemaSolicitud sol = new ReportarProblemaSolicitud(
                TipoTicket.INCIDENTE, "Falla teclado", "Teclas no responden",
                Impacto.MEDIO, Urgencia.MEDIA, ObjetivoFalla.EQUIPO_ACTUAL, null, null);

        assertThatThrownBy(() -> resolutorEquipo.resolverEquipoAfectado(sol, ctx))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("No se detectó la computadora de origen");
    }

    @Test
    @DisplayName("ObjetivoImpresoraArea: debe validar que la impresora pertenezca al área")
    void debeResolverImpresoraDelArea() {
        ImpresoraAreaRespuesta imp1 = new ImpresoraAreaRespuesta(25, "IMP-ADM-01", "Impresora 1", null, "192.168.10.21");
        ContextoAtencionRespuesta ctx = new ContextoAtencionRespuesta(
                EstadoDeteccion.DETECTADO, "192.168.10.12", null, null, List.of(imp1), null, false);

        ReportarProblemaSolicitud sol = new ReportarProblemaSolicitud(
                TipoTicket.INCIDENTE, "Atasco papel", "Atasco de papel continuo",
                Impacto.MEDIO, Urgencia.MEDIA, ObjetivoFalla.IMPRESORA_AREA, 25, null);

        Integer idCi = resolutorImpresora.resolverEquipoAfectado(sol, ctx);
        assertThat(idCi).isEqualTo(25);
    }

    @Test
    @DisplayName("ObjetivoImpresoraArea: debe rechazar con 422 si la impresora reportada no pertenece al área")
    void debeRechazarImpresoraDeOtraArea() {
        ImpresoraAreaRespuesta imp1 = new ImpresoraAreaRespuesta(25, "IMP-ADM-01", "Impresora 1", null, "192.168.10.21");
        ContextoAtencionRespuesta ctx = new ContextoAtencionRespuesta(
                EstadoDeteccion.DETECTADO, "192.168.10.12", null, null, List.of(imp1), null, false);

        // Intenta reportar contra impresora id 99 (de otra área o inexistente)
        ReportarProblemaSolicitud sol = new ReportarProblemaSolicitud(
                TipoTicket.INCIDENTE, "Atasco papel", "Atasco de papel",
                Impacto.MEDIO, Urgencia.MEDIA, ObjetivoFalla.IMPRESORA_AREA, 99, null);

        assertThatThrownBy(() -> resolutorImpresora.resolverEquipoAfectado(sol, ctx))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("no pertenece al área detectada");
    }

    @Test
    @DisplayName("ObjetivoOtro: debe retornar null como equipo específico")
    void debeRetornarNullParaObjetivoOtro() {
        ReportarProblemaSolicitud sol = new ReportarProblemaSolicitud(
                TipoTicket.PETICION, "Creación usuario", "Acceso a sistema",
                Impacto.BAJO, Urgencia.BAJA, ObjetivoFalla.OTRO, null, null);

        Integer idCi = resolutorOtro.resolverEquipoAfectado(sol, null);
        assertThat(idCi).isNull();
    }
}
