package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando las credenciales de autenticación son incorrectas o no válidas.
 * Mapea a HTTP 401 Unauthorized.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException(String mensaje) {
        super(mensaje);
    }
}
