
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.security.red.ResolutorIpCliente;
import com.hospital.servicedesk.services.TicketService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final ResolutorIpCliente resolutorIpCliente;
    private final com.hospital.servicedesk.asistencial.atencion.aplicacion.ReportarProblemaService reportarProblemaService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = resolutorIpCliente.resolverIp(httpRequest);
        return new ResponseEntity<>(ticketService.createTicket(request, clientIp), HttpStatus.CREATED);
    }

    @PostMapping("/reportar")
    public ResponseEntity<TicketResponse> reportarProblema(
            @Valid @RequestBody com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud request,
            HttpServletRequest httpRequest,
            Authentication authentication) {
        String clientIp = resolutorIpCliente.resolverIp(httpRequest);
        String correo = authentication != null ? authentication.getName() : null;
        com.hospital.servicedesk.entities.Ticket ticket = reportarProblemaService.reportar(request, correo, clientIp);
        return new ResponseEntity<>(ticketService.getTicketById(ticket.getIdTicket()), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse>> getAllTickets(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String prioridad,
            @RequestParam(required = false) Integer idArea,
            @RequestParam(required = false) String texto) {
        return ResponseEntity.ok(ticketService.getTicketsPaginados(pagina, tamano, estado, prioridad, idArea, texto));
    }

    @GetMapping("/mis-tickets")
    public ResponseEntity<com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse>> getMisTickets(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.getMisTicketsPaginados(userEmail, pagina, tamano));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<Object>> getHistorialTicket(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getHistorialTicket(id));
    }

    @Deprecated
    @GetMapping("/contexto-cliente")
    public ResponseEntity<Map<String, Object>> getContextoCliente(HttpServletRequest httpRequest) {
        String clientIp = resolutorIpCliente.resolverIp(httpRequest);
        return ResponseEntity.ok(ticketService.getContextoCliente(clientIp));
    }

    @PutMapping("/{id}/asignar")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Integer id,
            @Valid @RequestBody AssignRequest request,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.assignTicket(id, request, userEmail));
    }

    @PutMapping("/{id}/tomar")
    public ResponseEntity<TicketResponse> tomarTicket(
            @PathVariable Integer id,
            Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.tomarTicket(id, userEmail));
    }

    @PutMapping("/{id}/iniciar")
    public ResponseEntity<TicketResponse> iniciarTicket(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.iniciarTicket(id));
    }

    @PutMapping("/{id}/escalar")
    public ResponseEntity<TicketResponse> escalarTicket(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.escalarTicket(id, request));
    }

    @PutMapping("/{id}/resolver")
    public ResponseEntity<TicketResponse> resolverTicket(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.resolverTicket(id, request));
    }

    @PutMapping("/{id}/cerrar")
    public ResponseEntity<TicketResponse> cerrarTicket(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.cerrarTicket(id));
    }

    @PutMapping("/{id}/reabrir")
    public ResponseEntity<TicketResponse> reabrirTicket(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.reabrirTicket(id, request));
    }

    @PutMapping("/{id}/conformidad")
    public ResponseEntity<TicketResponse> registrarConformidad(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.registrarConformidad(id, request != null ? request : Map.of()));
    }

    @PostMapping("/{id}/encuesta")
    public ResponseEntity<TicketResponse> registrarEncuesta(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.registrarEncuesta(id, request != null ? request : Map.of()));
    }

    @PutMapping("/{id}/equipo")
    public ResponseEntity<TicketResponse> vincularEquipo(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> request) {
        return ResponseEntity.ok(ticketService.vincularEquipo(id, request != null ? request : Map.of()));
    }
}

