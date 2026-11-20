package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando una operación viola una regla de negocio o validación funcional.
 * Mapea a HTTP 400 Bad Request.
 */
public class ReglaNegocioException extends RuntimeException {

    public ReglaNegocioException(String mensaje) {
        super(mensaje);
    }
}
