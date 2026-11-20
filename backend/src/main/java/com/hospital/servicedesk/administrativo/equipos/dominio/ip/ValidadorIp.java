package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Validador compuesto de direcciones IP (Composite / Chain of Responsibility).
 * Evalúa secuencialmente la lista inyectada de reglas de IP.
 */
@Component
public class ValidadorIp {

    private final List<ReglaIp> reglas;

    public ValidadorIp(List<ReglaIp> reglas) {
        this.reglas = reglas == null ? List.of() : List.copyOf(reglas);
    }

    /**
     * Evalúa una dirección IP contra todas las reglas registradas.
     *
     * @param ip Dirección IP a evaluar
     * @return Optional con la primera violación detectada, o empty si todas pasaron
     */
    public Optional<String> evaluar(String ip) {
        if (ip == null || ip.isBlank()) {
            return Optional.empty();
        }

        String sanitizada = ip.trim();
        for (ReglaIp regla : reglas) {
            Optional<String> violacion = regla.violacion(sanitizada);
            if (violacion.isPresent()) {
                return violacion;
            }
        }

        return Optional.empty();
    }

    /**
     * Valida la dirección IP y lanza ReglaNegocioException si no cumple alguna regla.
     */
    public void validarOExcepcion(String ip) {
        evaluar(ip).ifPresent(mensaje -> {
            throw new ReglaNegocioException("ipEstatica", mensaje);
        });
    }
}
