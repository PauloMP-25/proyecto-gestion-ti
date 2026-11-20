package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.dtos.TicketDTOs.*;
import java.util.List;
import java.util.Map;

/**
 * Contrato de servicio para el ciclo de vida y gestión de tickets hospitalarios.
 */
public interface TicketService {
    TicketResponse createTicket(CreateTicketRequest request, String clientIp);
    List<TicketResponse> getAllTickets();
    PaginaRespuesta<TicketResponse> getTicketsPaginados(int pagina, int tamano, String estado, String prioridad, Integer idArea, String texto);
    PaginaRespuesta<TicketResponse> getTicketsPaginados(int pagina, int tamano, String estado, String prioridad, Integer idArea, String texto, String asignadoA, String estados, String prioridades, String userEmail);
    Map<String, Object> getResumenTurno(String userEmail);
    long contarPorConfirmar(String userEmail);
    List<TicketResponse> getMisTickets(String userEmail);
    PaginaRespuesta<TicketResponse> getMisTicketsPaginados(String userEmail, int pagina, int tamano);
    TicketResponse getTicketById(Integer id);
    List<Object> getHistorialTicket(Integer id);
    TicketResponse assignTicket(Integer id, AssignRequest request, String userEmail);
    TicketResponse tomarTicket(Integer id, String userEmail);
    TicketResponse iniciarTicket(Integer id);
    TicketResponse escalarTicket(Integer id, Map<String, Object> request);
    TicketResponse resolverTicket(Integer id, Map<String, Object> request);
    TicketResponse cerrarTicket(Integer id);
    TicketResponse reabrirTicket(Integer id, Map<String, Object> request);
    TicketResponse registrarConformidad(Integer id, Map<String, Object> request);
    TicketResponse registrarEncuesta(Integer id, Map<String, Object> request);
    TicketResponse vincularEquipo(Integer id, Map<String, Object> request);
    Map<String, Object> getContextoCliente(String clientIp);
}
