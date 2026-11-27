package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.entities.Ticket;
import com.hospital.servicedesk.entities.Usuario;
import lombok.Builder;

public interface AuditoriaTicketService {

    void registrar(RegistroAuditoriaTicket registro);

    /** Datos de un evento auditable. `actor` null ⇒ acción del sistema. */
    @Builder
    record RegistroAuditoriaTicket(
            Ticket ticket,
            Usuario actor,
            String accion,
            String estadoAnterior,
            String estadoNuevo,
            String motivo,
            String detalle,
            String ipOrigen) {}
}
