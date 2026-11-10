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

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @PutMapping("/{id}/asignar")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Integer id,
            @Valid @RequestBody AssignRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.assignTicket(id, request.getTecnicoId(), email));
    }

    @PutMapping("/{id}/resolver")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable Integer id,
            @Valid @RequestBody ResolveRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.resolveTicket(id, request.getSolucion(), email));
    }

    @PutMapping("/{id}/cerrar")
    public ResponseEntity<TicketResponse> closeTicket(
            @PathVariable Integer id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(ticketService.closeTicket(id, email));
    }

    @GetMapping("/{id}/auditoria")
    public ResponseEntity<List<HistorialTicketResponse>> getTicketAudit(@PathVariable Integer id) {
        return ResponseEntity.ok(ticketService.getTicketAudit(id));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            xfHeader = request.getHeader("X-Real-IP");
        }
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            xfHeader = request.getRemoteAddr();
        }
        if (xfHeader != null && xfHeader.contains(",")) {
            xfHeader = xfHeader.split(",")[0].trim();
        }
        return xfHeader;
    }
}

