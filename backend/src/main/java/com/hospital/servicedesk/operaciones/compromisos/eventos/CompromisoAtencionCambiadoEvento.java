package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.*;

import java.time.LocalDateTime;

public record CompromisoAtencionCambiadoEvento(
        Integer idTicket, String asunto, Prioridad prioridad, EstadoSLA estadoAnterior, EstadoSLA estadoNuevo,
        LocalDateTime fechaLimite, String areaNombre, String correoTecnico, String nombreTecnico) {

    public static CompromisoAtencionCambiadoEvento desde(Ticket t, EstadoSLA anterior, EstadoSLA nuevo) {
        Usuario tec = t.getTecnicoAsignado();
        return new CompromisoAtencionCambiadoEvento(t.getIdTicket(), t.getAsunto(), t.getPrioridad(), anterior, nuevo,
                t.getFechaLimiteResolucion(), t.getArea().getNombre(),
                tec == null ? null : tec.getCorreo(), tec == null ? null : tec.getNombreVisible());
    }
}
