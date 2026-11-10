package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.TicketErrorConocido;
import com.hospital.servicedesk.entities.TicketErrorConocido.TicketErrorConocidoId;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketErrorConocidoRepository extends JpaRepository<TicketErrorConocido, TicketErrorConocidoId> {
    List<TicketErrorConocido> findByTicket_IdTicket(Integer idTicket);
    List<TicketErrorConocido> findByErrorConocido_IdError(Integer idError);
}
