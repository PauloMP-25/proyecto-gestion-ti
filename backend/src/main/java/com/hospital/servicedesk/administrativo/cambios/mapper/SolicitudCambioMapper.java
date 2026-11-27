package com.hospital.servicedesk.administrativo.cambios.mapper;

import com.hospital.servicedesk.administrativo.cambios.dominio.ValidadorSolicitudCambio;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;

import java.util.List;
import java.util.stream.IntStream;

public final class SolicitudCambioMapper {

    private SolicitudCambioMapper() {}

    public static CambioResumenRespuesta aResumen(SolicitudCambio s) {
        return new CambioResumenRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante() != null ? s.getSolicitante().getNombreVisible() : "Sistema",
                s.getResponsableEjecucion(), s.getFechaRegistro()
        );
    }

    public static CambioDetalleRespuesta aDetalle(SolicitudCambio s, List<HistorialSolicitudCambio> historial,
                                                  List<AccionCambio> acciones, List<String> advertencias) {
        List<AreaAfectadaRespuesta> areas = s.getAreasAfectadas().stream()
                .map(a -> new AreaAfectadaRespuesta(a.getIdArea(), a.getNombre(), ValidadorSolicitudCambio.esAreaCritica(a)))
                .toList();

        EvaluacionImpactoRespuesta eval = new EvaluacionImpactoRespuesta(
                s.getImpacto(), areas, s.isRequiereInterrupcion(), s.getMinutosInterrupcion(),
                s.getServiciosAfectados(), s.getPacientesPotencialmenteAfectados(), s.getDescripcionImpacto()
        );

        List<PasoPlanRespuesta> pasosImpl = IntStream.range(0, s.getPasosImplementacion().size())
                .mapToObj(i -> {
                    var p = s.getPasosImplementacion().get(i);
                    return new PasoPlanRespuesta(i + 1, p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados());
                }).toList();

        List<PasoPlanRespuesta> pasosRev = IntStream.range(0, s.getPasosReversa().size())
                .mapToObj(i -> {
                    var p = s.getPasosReversa().get(i);
                    return new PasoPlanRespuesta(i + 1, p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados());
                }).toList();

        PlanReversaRespuesta rev = new PlanReversaRespuesta(
                s.getCriterioReversa(), pasosRev, s.getMinutosReversa(), s.getPlanContinuidad(), s.getResponsableReversa()
        );

        List<EventoCambioRespuesta> hist = historial.stream()
                .map(h -> new EventoCambioRespuesta(
                        h.getFecha(),
                        h.getUsuario() != null ? h.getUsuario().getNombreVisible() : "Sistema",
                        h.getEstadoAnterior(),
                        h.getEstadoNuevo(),
                        h.getObservacion()
                )).toList();

        return new CambioDetalleRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante() != null ? s.getSolicitante().getNombreVisible() : "Sistema",
                s.getResponsableEjecucion(), s.getFechaRegistro(), s.getDescripcion(), s.getJustificacion(),
                s.getEquiposAfectados(), s.getTicketOrigen() != null ? s.getTicketOrigen().getIdTicket() : null,
                eval, pasosImpl, rev,
                s.getAprobador() != null ? s.getAprobador().getNombreVisible() : null,
                s.getFechaDecision(), s.getObservacionDecision(), s.getResultadoImplementacion(),
                s.getFechaInicioReal(), s.getFechaFinReal(), hist, acciones, advertencias, s.getVersion()
        );
    }

    private static List<String> nombresAreas(SolicitudCambio s) {
        return s.getAreasAfectadas().stream().map(Area::getNombre).toList();
    }

    private static HorarioProgramado horario(SolicitudCambio s) {
        return s.getHorarioInicio() == null ? null : new HorarioProgramado(s.getHorarioInicio(), s.getHorarioFin());
    }
}
