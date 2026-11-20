package com.hospital.servicedesk.administrativo.equipos.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.servicedesk.compartido.util.Texto;
import com.hospital.servicedesk.compartido.validacion.PatronesValidacion;
import com.hospital.servicedesk.entities.TipoCI;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Locale;

@JsonIgnoreProperties(ignoreUnknown = false)
public record EquipoSolicitud(
        @NotNull(message = "El tipo de equipo es obligatorio (ej: COMPUTADORA, IMPRESORA)")
        TipoCI tipo,

        @NotBlank(message = "El código de inventario es obligatorio")
        @Size(max = 30, message = "El código de inventario no puede superar 30 caracteres")
        @Pattern(regexp = "^[A-Z0-9-]+$", message = "El código de inventario solo admite letras mayúsculas, dígitos y guiones")
        String codigoInventario,

        @NotBlank(message = "El nombre descriptivo del equipo es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @Size(max = 100, message = "El hostname no puede superar 100 caracteres")
        String hostname,

        @Pattern(regexp = PatronesValidacion.MAC, message = "Formato de dirección MAC inválido (ej: AA:BB:CC:DD:EE:FF)")
        String mac,

        @Size(max = 150, message = "La referencia de ubicación no puede superar 150 caracteres")
        String referenciaUbicacion,

        @Size(max = 100, message = "La marca y modelo no pueden superar 100 caracteres")
        String marcaModelo,

        @NotNull(message = "El área hospitalaria de adscripción es obligatoria")
        @Positive(message = "El identificador de área debe ser un entero positivo")
        Integer idArea,

        @Pattern(regexp = PatronesValidacion.IPV4_ESTRICTA, message = "Formato IPv4 inválido o con ceros a la izquierda")
        String ipEstatica
) {
    public EquipoSolicitud {
        codigoInventario = codigoInventario == null ? null : codigoInventario.trim().toUpperCase(Locale.ROOT);
        mac = mac == null ? null : mac.trim().toUpperCase(Locale.ROOT).replace('-', ':');
        ipEstatica = Texto.vacioANulo(ipEstatica);
        hostname = Texto.vacioANulo(hostname);
        marcaModelo = Texto.vacioANulo(marcaModelo);
        referenciaUbicacion = Texto.vacioANulo(referenciaUbicacion);
    }
}
