package com.hospital.servicedesk.administrativo.areas.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.servicedesk.compartido.util.Texto;
import com.hospital.servicedesk.compartido.validacion.PatronesValidacion;
import jakarta.validation.constraints.*;

@JsonIgnoreProperties(ignoreUnknown = false)
public record AreaSolicitud(
        @NotBlank(message = "El nombre del área es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombre,

        @Min(value = 0, message = "El piso no puede ser menor que 0")
        @Max(value = 20, message = "El piso no puede ser mayor que 20")
        Integer piso,

        @Size(max = 150, message = "La referencia de ubicación no puede superar 150 caracteres")
        String referenciaUbicacion,

        @Size(max = 20, message = "El anexo telefónico no puede superar 20 caracteres")
        @Pattern(regexp = PatronesValidacion.ANEXO, message = "El anexo solo admite dígitos numéricos")
        String anexo,

        @Positive(message = "El identificador del encargado debe ser positivo")
        Integer idEncargado,

        @Size(max = 20, message = "La prioridad por defecto no puede superar 20 caracteres")
        String prioridadDefecto
) {
    public AreaSolicitud {
        nombre = Texto.normalizar(nombre);
        referenciaUbicacion = Texto.vacioANulo(Texto.normalizar(referenciaUbicacion));
        anexo = Texto.vacioANulo(anexo);
        prioridadDefecto = prioridadDefecto != null && !prioridadDefecto.isBlank() ? prioridadDefecto.trim().toUpperCase() : "P3";
    }
}
