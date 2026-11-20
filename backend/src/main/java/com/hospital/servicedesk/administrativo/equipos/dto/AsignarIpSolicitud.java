package com.hospital.servicedesk.administrativo.equipos.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.servicedesk.compartido.util.Texto;
import com.hospital.servicedesk.compartido.validacion.PatronesValidacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@JsonIgnoreProperties(ignoreUnknown = false)
public record AsignarIpSolicitud(
        @NotBlank(message = "La dirección IP es obligatoria")
        @Pattern(regexp = PatronesValidacion.IPV4_ESTRICTA, message = "Formato IPv4 inválido o con ceros a la izquierda")
        String ipEstatica
) {
    public AsignarIpSolicitud {
        ipEstatica = Texto.vacioANulo(ipEstatica);
    }
}
