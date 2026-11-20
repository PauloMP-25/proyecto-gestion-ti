package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import java.util.Optional;

/**
 * Contrato extensible (Open/Closed Principle) para reglas de validación de direcciones IP.
 */
public interface ReglaIp {

    /**
     * Evalúa si una dirección IP viola la regla.
     *
     * @param ip Dirección IPv4 sanitizada
     * @return Optional con el mensaje explicativo de la violación, o empty si es válida
     */
    Optional<String> violacion(String ip);
}
