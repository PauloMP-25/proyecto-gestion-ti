package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando ocurre un conflicto con el estado actual o unicidad de un recurso.
 * Mapea a HTTP 409 Conflict.
 */
public class ConflictoNegocioException extends RuntimeException {

    private final String campo;

    public ConflictoNegocioException(String mensaje) {
        super(mensaje);
        this.campo = null;
    }

    public ConflictoNegocioException(String campo, String mensaje) {
        super(mensaje);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
