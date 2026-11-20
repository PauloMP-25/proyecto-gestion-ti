package com.hospital.servicedesk.administrativo.equipos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Propiedades inmutables de red institucional para la validación de direccionamiento IP estático.
 */
@ConfigurationProperties(prefix = "hsmsi.red")
public record PropiedadesRed(
        @DefaultValue("true") boolean exigirIpPrivada,
        @DefaultValue("true") boolean permitirLoopbackDev
) {}
