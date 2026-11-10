
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
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

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
        return new ResponseEntity<>(ticketService.createTicket(request, clientIp), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @GetMapping("/mis-tickets")
    public ResponseEntity<List<TicketResponse>> getMisTickets(Authentication authentication) {
        String userEmail = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.getMisTickets(userEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<Object>> getHistorialTicket(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getHistorialTicket(id));
    }

    @GetMapping("/contexto-cliente")
    public ResponseEntity<Map<String, Object>> getContextoCliente(HttpServletRequest httpRequest) {
        String clientIp = extractClientIp(httpRequest);
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

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}

