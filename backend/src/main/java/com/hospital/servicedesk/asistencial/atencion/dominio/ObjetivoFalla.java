package com.hospital.servicedesk.asistencial.atencion.dominio;

/**
 * Objetivo o foco del problema reportado por el personal hospitalario.
 * Usado en la ficha simplificada de solicitud de soporte.
 */
public enum ObjetivoFalla {
    /**
     * El incidente se presenta en la computadora desde la cual se está reportando.
     */
    EQUIPO_ACTUAL,

    /**
     * El incidente afecta a una de las impresoras de red del área detectada.
     */
    IMPRESORA_AREA,

    /**
     * El incidente corresponde a otro equipo, sistema o servicio institucional.
     */
    OTRO
}
