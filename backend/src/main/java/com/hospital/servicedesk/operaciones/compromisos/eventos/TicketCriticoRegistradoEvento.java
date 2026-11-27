package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.Ticket;

public record TicketCriticoRegistradoEvento(Integer idTicket, String asunto, String areaNombre, String ipOrigen) {
    public static TicketCriticoRegistradoEvento desde(Ticket t) {
        return new TicketCriticoRegistradoEvento(t.getIdTicket(), t.getAsunto(), t.getArea().getNombre(), t.getIpOrigen());
    }
}
