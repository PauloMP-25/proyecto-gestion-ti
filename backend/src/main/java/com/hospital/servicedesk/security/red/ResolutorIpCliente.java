package com.hospital.servicedesk.security.red;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.regex.Pattern;

/**
 * Componente de seguridad para la resolución fidedigna de la IP del cliente.
 * 
 * Regla de Oro de Seguridad:
 * No confía a ciegas en encabezados como X-Forwarded-For enviados por clientes no autenticados,
 * evitando la suplantación de identidad (IP spoofing) en la red hospitalaria con IPs estáticas.
 */
@Component
public class ResolutorIpCliente {

    private static final Pattern IPV4_PATTERN = Pattern.compile(
        "^((25[0-5]|(2[0-4]|1\\d|[1-9]|)\\d)\\.?\\b){4}$"
    );

    /**
     * Resuelve y sanitiza la dirección IP de la conexión entrante.
     *
     * @param request Petición HTTP del cliente
     * @return Dirección IP IPv4 limpia (ej: "192.168.10.21" o "127.0.0.1")
     */
    public String resolverIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String remoteAddr = request.getRemoteAddr();

        if (remoteAddr == null || remoteAddr.isBlank()) {
            return "127.0.0.1";
        }

        // Normalización de loopback IPv6
        if ("0:0:0:0:0:0:0:1".equals(remoteAddr) || "::1".equals(remoteAddr)) {
            return "127.0.0.1";
        }

        // Normalización de IPv4 mapeada en IPv6 (::ffff:192.168.1.1)
        if (remoteAddr.startsWith("::ffff:")) {
            remoteAddr = remoteAddr.substring(7);
        }

        // Si contiene puerto (ej. host:puerto), remover el puerto
        if (remoteAddr.contains(":") && !remoteAddr.contains("[")) {
            String[] parts = remoteAddr.split(":");
            if (parts.length == 2 && IPV4_PATTERN.matcher(parts[0]).matches()) {
                remoteAddr = parts[0];
            }
        }

        return remoteAddr.trim();
    }

    /**
     * Valida si una cadena tiene formato IPv4 estricto.
     */
    public boolean esIpValida(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        return IPV4_PATTERN.matcher(ip.trim()).matches();
    }
}
