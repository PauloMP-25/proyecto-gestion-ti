package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import com.hospital.servicedesk.administrativo.equipos.config.PropiedadesRed;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Regla de rechazo de direcciones IPv4 reservadas, multicast o direcciones de red/broadcast.
 */
@Component
@Order(20)
public class ReglaIpNoReservada implements ReglaIp {

    private final PropiedadesRed propiedades;

    public ReglaIpNoReservada(PropiedadesRed propiedades) {
        this.propiedades = propiedades;
    }

    @Override
    public Optional<String> violacion(String ip) {
        if (ip == null || ip.isBlank()) {
            return Optional.empty();
        }

        String[] octetos = ip.split("\\.");
        if (octetos.length != 4) {
            return Optional.empty(); // Delegado a ReglaIpv4Estricta
        }

        try {
            int o1 = Integer.parseInt(octetos[0]);
            int o2 = Integer.parseInt(octetos[1]);
            int o3 = Integer.parseInt(octetos[2]);
            int o4 = Integer.parseInt(octetos[3]);

            if (o1 == 0 && o2 == 0 && o3 == 0 && o4 == 0) {
                return Optional.of("La dirección 0.0.0.0 es una dirección reservada no asignable a equipos");
            }

            if (o1 == 255 && o2 == 255 && o3 == 255 && o4 == 255) {
                return Optional.of("La dirección 255.255.255.255 es una dirección de broadcast global no asignable");
            }

            // Loopback 127.x.x.x
            if (o1 == 127) {
                if (!propiedades.permitirLoopbackDev()) {
                    return Optional.of("La dirección de bucle local (loopback) no está permitida en entorno institucional");
                }
                return Optional.empty();
            }

            // Multicast 224.0.0.0 a 239.255.255.255
            if (o1 >= 224 && o1 <= 239) {
                return Optional.of("El rango 224.0.0.0 a 239.255.255.255 está reservado para tráfico Multicast");
            }

            // Direcciones de red y broadcast de segmento (.0 y .255)
            if (o4 == 0) {
                return Optional.of("Las direcciones terminadas en .0 corresponden a identificadores de red de subred");
            }
            if (o4 == 255) {
                return Optional.of("Las direcciones terminadas en .255 corresponden a direcciones de difusión (broadcast)");
            }

        } catch (NumberFormatException e) {
            return Optional.of("Octetos numéricos no válidos en dirección IP");
        }

        return Optional.empty();
    }
}
