package com.hospital.servicedesk.exceptions;

/**
 * Excepción lanzada cuando una operación viola una regla de negocio o validación funcional.
 * Mapea a HTTP 400 Bad Request.
 */
public class ReglaNegocioException extends RuntimeException {

    private final String campo;

    public ReglaNegocioException(String mensaje) {
        super(mensaje);
        this.campo = null;
    }

    public ReglaNegocioException(String campo, String mensaje) {
        super(mensaje);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
