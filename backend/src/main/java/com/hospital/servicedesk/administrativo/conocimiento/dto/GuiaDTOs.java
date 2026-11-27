package com.hospital.servicedesk.administrativo.conocimiento.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.hospital.servicedesk.entities.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class GuiaDTOs {

    private GuiaDTOs() {}

    public record PasoFormulario(
            @NotBlank(message = "Describa el paso.")
            @Size(max = 500, message = "Máximo 500 caracteres.") String descripcion,
            @Size(max = 300) String advertencia) {}

    public record GuiaFormulario(
            @NotBlank(message = "Escriba el título de la guía.")
            @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres.") String titulo,

            @NotBlank(message = "Escriba un resumen breve.")
            @JsonAlias("descripcionProblema")
            @Size(max = 2000) String resumen,

            @Size(max = 500) String sintoma,
            @Size(max = 1000) String causaRaiz,

            @NotBlank(message = "Describa la solución.")
            @JsonAlias("solucionTrabajo")
            @Size(max = 4000) String contenidoHtml,

            @NotNull(message = "Seleccione la categoría.") Integer categoriaId,
            @NotNull(message = "Seleccione el ámbito.") AmbitoGuia ambito,
            @NotNull(message = "Seleccione el nivel de dificultad.") NivelDificultad nivelDificultad,
            @Positive Integer minutosEstimados,
            boolean requiereTecnico,

            List<@NotBlank @Size(max = 50) String> palabrasClave,
            List<@NotBlank @Size(max = 30) String> equiposCompatibles,
            List<@Size(max = 300) String> precauciones,
            List<@Valid PasoFormulario> pasos) {}

    public record VotoFormulario(
            @NotNull(message = "Indique si la guía le fue útil.") Boolean util) {}

    public record PasoRespuesta(int orden, String descripcion, String advertencia) {}

    public record GuiaRespuesta(
            Integer id,
            String titulo,
            String resumen,
            CategoriaGuia categoria,
            AmbitoGuia ambito,
            NivelDificultad nivelDificultad,
            int minutosEstimados,
            boolean requiereTecnico,
            int conteoUtil,
            int conteoVisitas,
            boolean esUtilPorMi,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaActualizacionIso,
            boolean requiereTecnicoBadge,
            String autorNombre,
            Integer idError,
            String descripcionProblema,
            String solucionTrabajo,
            boolean publicado,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCreacion) {}

    public record GuiaDetalleRespuesta(
            Integer id,
            String titulo,
            String resumen,
            String sintoma,
            String causaRaiz,
            String contenidoHtml,
            CategoriaGuia categoria,
            AmbitoGuia ambito,
            NivelDificultad nivelDificultad,
            int minutosEstimados,
            boolean requiereTecnico,
            List<String> palabrasClave,
            List<String> equiposCompatibles,
            List<String> precauciones,
            List<PasoRespuesta> pasos,
            int conteoUtil,
            int conteoNoUtil,
            int conteoVisitas,
            Boolean miVotoUtil,
            String autorNombre,
            Integer idError,
            String descripcionProblema,
            String solucionTrabajo,
            boolean publicado,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fechaCreacion) {}

    public record ConteoCategoriaRespuesta(int id, String clave, String etiqueta, long total) {}
}
