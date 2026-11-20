package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando ocurre un conflicto con el estado actual o unicidad de un recurso.
 * Mapea a HTTP 409 Conflict.
 */
public class ConflictoNegocioException extends RuntimeException {

    public ConflictoNegocioException(String mensaje) {
        super(mensaje);
    }
}
