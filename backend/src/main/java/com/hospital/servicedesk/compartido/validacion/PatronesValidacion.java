package com.hospital.servicedesk.compartido.validacion;

/**
 * Expresiones regulares estrictas para la validación de contratos del sistema.
 */
public final class PatronesValidacion {

    private PatronesValidacion() {}

    /**
     * IPv4 estricta sin ceros a la izquierda (0-255 en cada octeto).
     * Rechaza "192.168.010.012".
     */
    public static final String IPV4_ESTRICTA =
            "^(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
            + "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
            + "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\."
            + "(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$";


    /**
     * Anexo telefónico hospitalario (1 a 20 dígitos numéricos).
     */
    public static final String ANEXO = "^[0-9]{1,20}$";

    /**
     * Nombre de usuario institucional: 3 a 40 caracteres en minúsculas, números, puntos o guiones bajos.
     */
    public static final String NOMBRE_USUARIO = "^[a-z0-9._]{3,40}$";
}
