package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando una petición carece de sesión o token válido.
 * Mapea a HTTP 401 Unauthorized.
 */
public class NoAutorizadoException extends RuntimeException {

    public NoAutorizadoException(String mensaje) {
        super(mensaje);
    }
}
