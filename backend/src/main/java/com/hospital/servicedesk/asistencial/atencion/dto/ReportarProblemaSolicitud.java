package com.hospital.servicedesk.asistencial.atencion.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.compartido.util.Texto;
import com.hospital.servicedesk.entities.Impacto;
import com.hospital.servicedesk.entities.TipoTicket;
import com.hospital.servicedesk.entities.Urgencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Solicitud de reporte de incidente hospitalario simplificada y contextual.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ReportarProblemaSolicitud(
        @NotNull(message = "El tipo de solicitud es obligatorio")
        TipoTicket tipo,

        @NotBlank(message = "El asunto o título del problema es obligatorio")
        @Size(max = 150, message = "El asunto no puede superar 150 caracteres")
        String asunto,

        @NotBlank(message = "La descripción detallada del problema es obligatoria")
        @Size(max = 2000, message = "La descripción no puede superar 2000 caracteres")
        String descripcion,

        @NotNull(message = "El impacto sobre la atención asistencial es obligatorio")
        Impacto impacto,

        @NotNull(message = "La urgencia del incidente es obligatoria")
        Urgencia urgencia,

        @NotNull(message = "El objetivo del problema es obligatorio (ej. EQUIPO_ACTUAL, IMPRESORA_AREA, OTRO)")
        ObjetivoFalla objetivo,

        @Positive(message = "El identificador de la impresora debe ser positivo")
        Integer idImpresora,

        @Positive(message = "El identificador del área manual debe ser positivo")
        Integer idAreaManual
) {
    public ReportarProblemaSolicitud {
        asunto = Texto.normalizar(asunto);
        descripcion = Texto.vacioANulo(descripcion);
    }
}
