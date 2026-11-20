package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import com.hospital.servicedesk.compartido.validacion.PatronesValidacion;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Regla de validación de sintaxis IPv4 estricta sin ceros a la izquierda.
 */
@Component
@Order(10)
public class ReglaIpv4Estricta implements ReglaIp {

    private static final Pattern PATTERN = Pattern.compile(PatronesValidacion.IPV4_ESTRICTA);

    @Override
    public Optional<String> violacion(String ip) {
        if (ip == null || ip.isBlank()) {
            return Optional.of("La dirección IP no puede estar vacía");
        }
        if (!PATTERN.matcher(ip.trim()).matches()) {
            return Optional.of("Formato IPv4 inválido o con ceros a la izquierda (ej. 192.168.10.12)");
        }
        return Optional.empty();
    }
}
