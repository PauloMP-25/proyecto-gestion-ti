package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando un usuario se encuentra deshabilitado en el sistema hospitalario.
 * Mapea a HTTP 403 Forbidden.
 */
public class UsuarioInactivoException extends RuntimeException {

    public UsuarioInactivoException(String mensaje) {
        super(mensaje);
    }
}
