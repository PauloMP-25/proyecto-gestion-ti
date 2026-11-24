package com.hospital.servicedesk.administrativo.cambios.dto;

import com.hospital.servicedesk.entities.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class SolicitudCambioDTOs {

    private SolicitudCambioDTOs() {}

    public record HorarioProgramado(
            @NotNull(message = "Indique la fecha y hora de inicio.") LocalDateTime inicioIso,
            @NotNull(message = "Indique la fecha y hora de fin.") LocalDateTime finIso) {}

    public record PasoPlanFormulario(
            @NotBlank(message = "Describa el paso.")
            @Size(max = 500, message = "Cada paso admite hasta 500 caracteres.") String descripcion,
            @Size(max = 120) String responsable,
            @Positive(message = "Los minutos estimados deben ser mayores a cero.")
            @Max(value = 1440, message = "Un paso no puede durar más de 24 horas.") Integer minutosEstimados) {}

    public record EvaluacionImpactoFormulario(
            @NotNull(message = "Seleccione el nivel de impacto asistencial.") ImpactoAsistencial nivel,
            @NotEmpty(message = "Seleccione al menos un área del hospital afectada.")
            List<@NotNull Integer> idsAreasAfectadas,
            @NotNull(message = "Indique si el cambio requiere interrupción de servicios.") Boolean requiereInterrupcion,
            @PositiveOrZero Integer minutosInterrupcion,
            @Size(max = 500) String pacientesAfectados,
            @NotBlank(message = "Describa el impacto esperado.")
            @Size(max = 2000, message = "Máximo 2000 caracteres.") String descripcionImpacto) {}

    public record PlanReversaFormulario(
            @NotBlank(message = "El criterio de reversa es obligatorio.")
            @Size(max = 500) String criterioActivacion,
            @NotEmpty(message = "El plan de reversa debe tener al menos un paso.")
            List<@NotNull @Valid PasoPlanFormulario> pasos,
            @NotNull @Positive(message = "Indique los minutos estimados para la reversa.") Integer minutosEstimados,
            @Size(max = 1000) String planContinuidad,
            @NotBlank(message = "Indique el responsable de reversa.")
            @Size(max = 120) String responsableReversa) {}

    public record SolicitudCambioFormulario(
            @NotBlank(message = "El título es obligatorio.")
            @Size(max = 120, message = "Máximo 120 caracteres.") String titulo,
            @NotNull(message = "Seleccione el tipo de cambio.") TipoCambio tipo,
            @NotNull(message = "Seleccione la categoría.") CategoriaCambio categoria,
            @NotBlank(message = "La descripción técnica es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String descripcion,
            @NotBlank(message = "La justificación de negocio es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String justificacion,
            @Size(max = 120) String responsableEjecucion,
            @Valid HorarioProgramado horario,
            @NotNull @Valid EvaluacionImpactoFormulario evaluacion,
            List<@NotBlank @Size(max = 150) String> serviciosAfectados,
            List<@NotBlank @Size(max = 30) String> equiposAfectados,
            @NotEmpty(message = "Agregue al menos un paso de implementación.")
            List<@NotNull @Valid PasoPlanFormulario> pasosImplementacion,
            @NotNull @Valid PlanReversaFormulario planReversa,
            Integer idTicketOrigen) {}

    public record TransicionCambioSolicitud(
            @NotNull(message = "Indique la acción a realizar.") AccionCambio accion,
            @Size(max = 1000, message = "La observación no puede superar los 1000 caracteres.") String observacion) {}

    public record AreaAfectadaRespuesta(Integer idArea, String nombre, boolean esCritica) {}

    public record PasoPlanRespuesta(int orden, String descripcion, String responsable, Integer minutosEstimados) {}

    public record EvaluacionImpactoRespuesta(
            ImpactoAsistencial nivel,
            List<AreaAfectadaRespuesta> areasAfectadas,
            boolean requiereInterrupcion,
            Integer minutosInterrupcion,
            List<String> serviciosAfectados,
            String pacientesPotencialmenteAfectados,
            String descripcion) {}

    public record PlanReversaRespuesta(
            String criterioActivacion,
            List<PasoPlanRespuesta> pasos,
            Integer minutosEstimados,
            String planContinuidad,
            String responsableReversa) {}

    public record EventoCambioRespuesta(
            LocalDateTime fechaIso,
            String usuarioNombre,
            EstadoCambio estadoAnterior,
            EstadoCambio estadoNuevo,
            String observacion) {}

    public record CambioResumenRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso) {}

    public record CambioDetalleRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso,
            String descripcion,
            String justificacion,
            List<String> equiposAfectados,
            Integer idTicketOrigen,
            EvaluacionImpactoRespuesta evaluacion,
            List<PasoPlanRespuesta> pasosImplementacion,
            PlanReversaRespuesta planReversa,
            String aprobador,
            LocalDateTime fechaDecisionIso,
            String observacionDecision,
            String resultadoImplementacion,
            LocalDateTime fechaInicioRealIso,
            LocalDateTime fechaFinRealIso,
            List<EventoCambioRespuesta> historial,
            List<AccionCambio> accionesPermitidas,
            List<String> advertencias,
            Long version) {}
}
