package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando un recurso solicitado no existe en la base de datos o sistema.
 * Mapea a HTTP 404 Not Found.
 */
public class RecursoNoEncontradoException extends RuntimeException {

    public RecursoNoEncontradoException(String mensaje) {
        super(mensaje);
    }

    public RecursoNoEncontradoException(String recurso, Object id) {
        super(String.format("%s no encontrado(a) con identificador: %s", recurso, id));
    }
}
