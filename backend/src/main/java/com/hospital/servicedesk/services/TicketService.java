package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.Usuario;
import java.util.List;

public interface TicketService {
    TicketResponse createTicket(CreateTicketRequest request, String clientIp);
    List<TicketResponse> getAllTickets();
    TicketResponse getTicketById(Integer id);
    TicketResponse assignTicket(Integer id, Integer tecnicoId, String userEmail);
    TicketResponse resolveTicket(Integer id, String solucionDetalle, String userEmail);
    TicketResponse closeTicket(Integer id, String userEmail);
    List<HistorialTicketResponse> getTicketAudit(Integer id);
}
