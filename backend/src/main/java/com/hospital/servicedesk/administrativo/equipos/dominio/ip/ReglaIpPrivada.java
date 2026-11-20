package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import com.hospital.servicedesk.administrativo.equipos.config.PropiedadesRed;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Regla que exige direcciones pertenecientes a rangos privados RFC 1918
 * para la infraestructura de intranet hospitalaria.
 */
@Component
@Order(30)
public class ReglaIpPrivada implements ReglaIp {

    private final PropiedadesRed propiedades;

    public ReglaIpPrivada(PropiedadesRed propiedades) {
        this.propiedades = propiedades;
    }

    @Override
    public Optional<String> violacion(String ip) {
        if (!propiedades.exigirIpPrivada() || ip == null || ip.isBlank()) {
            return Optional.empty();
        }

        String[] octetos = ip.split("\\.");
        if (octetos.length != 4) {
            return Optional.empty();
        }

        try {
            int o1 = Integer.parseInt(octetos[0]);
            int o2 = Integer.parseInt(octetos[1]);

            // Permitir loopback en desarrollo si está habilitado
            if (o1 == 127 && propiedades.permitirLoopbackDev()) {
                return Optional.empty();
            }

            // 10.0.0.0/8
            if (o1 == 10) {
                return Optional.empty();
            }

            // 172.16.0.0/12
            if (o1 == 172 && o2 >= 16 && o2 <= 31) {
                return Optional.empty();
            }

            // 192.168.0.0/16
            if (o1 == 192 && o2 == 168) {
                return Optional.empty();
            }

            return Optional.of("La dirección IP debe pertenecer a los rangos privados de red interna (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)");

        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }
}
