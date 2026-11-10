package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import java.util.List;
import java.util.Map;

public interface TicketService {
    TicketResponse createTicket(CreateTicketRequest request, String clientIp);
    List<TicketResponse> getAllTickets();
    TicketResponse getTicketById(Integer id);
    TicketResponse assignTicket(Integer id, AssignRequest request, String userEmail);
    Map<String, Object> getContextoCliente(String clientIp);
}
