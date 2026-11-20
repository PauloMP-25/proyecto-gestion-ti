package com.hospital.servicedesk.asistencial.atencion.dominio;

/**
 * Estado del motor de autodetección de contexto físico y de red hospitalaria.
 */
public enum EstadoDeteccion {
    /**
     * La dirección IP coincide con una asignación estática vigente a un equipo activo
     * adscrito a un área hospitalaria activa.
     */
    DETECTADO,

    /**
     * La dirección IP está registrada en la infraestructura de red pero no tiene asignación activa a un equipo.
     */
    IP_SIN_EQUIPO,

    /**
     * La dirección IP no se encuentra registrada en la base de datos institucional.
     */
    IP_NO_REGISTRADA
}
