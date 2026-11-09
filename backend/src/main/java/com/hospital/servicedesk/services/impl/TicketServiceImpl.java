package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIpRepository ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest req, String clientIp) {
        Area area = null; ElementoConfiguracion ci = null;
        if (clientIp != null && !clientIp.isBlank()) {
            if ("0:0:0:0:0:0:0:1".equals(clientIp) || "::1".equals(clientIp)) clientIp = "127.0.0.1";
            Optional<HistorialAsignacionIP> assignment = ipRepo.findActiveAssignmentByIp(clientIp);
            if (assignment.isPresent()) { ci = assignment.get().getElementoConfiguracion(); if (ci != null) area = ci.getArea(); }
        }
        if (area == null) area = areaRepo.findAll().stream().findFirst().orElseGet(() -> areaRepo.save(Area.builder().nombre("Soporte General").build()));
        Prioridad pri = calcPri(req.getImpacto(), req.getUrgencia());
        Ticket ticket = Ticket.builder()
                .tipo(req.getTipo()).asunto(req.getAsunto()).descripcion(req.getDescripcion())
                .impacto(req.getImpacto()).urgencia(req.getUrgencia()).prioridad(pri)
                .estado(EstadoTicket.ABIERTO).area(area).elementoConfiguracion(ci).ipOrigen(clientIp)
                .fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO).build();
        Ticket saved = tRepo.save(ticket);
        auditRepo.save(HistorialTicket.builder().ticket(saved).accion("CREACION").detalle("Creado IP: " + clientIp).build());
        return map(saved);
    }

    @Override
    public List<TicketResponse> getAllTickets() { return tRepo.findAll().stream().map(this::map).collect(Collectors.toList()); }

    @Override
    public TicketResponse getTicketById(Integer id) { return map(find(id)); }

    @Override
    @Transactional
    public TicketResponse assignTicket(Integer id, Integer techId, String email) {
        Ticket t = find(id);
        Usuario tech = userRepo.findById(techId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Técnico no encontrado"));
        t.setTecnicoAsignado(tech); t.setEstado(EstadoTicket.EN_PROGRESO); tRepo.save(t);
        auditRepo.save(HistorialTicket.builder().ticket(t).usuario(getUser(email)).accion("ASIGNACION").detalle("Asignado a " + tech.getNombres()).build());
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse resolveTicket(Integer id, String sol, String email) {
        Ticket t = find(id);
        t.setEstado(EstadoTicket.RESUELTO); tRepo.save(t);
        auditRepo.save(HistorialTicket.builder().ticket(t).usuario(getUser(email)).accion("RESOLUCION").detalle("Resuelto: " + sol).build());
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse closeTicket(Integer id, String email) {
        Ticket t = find(id);
        t.setEstado(EstadoTicket.CERRADO); tRepo.save(t);
        auditRepo.save(HistorialTicket.builder().ticket(t).usuario(getUser(email)).accion("CIERRE").detalle("Cerrado formalmente").build());
        return map(t);
    }

    @Override
    public List<HistorialTicketResponse> getTicketAudit(Integer id) {
        find(id);
        return auditRepo.findByTicketIdTicket(id).stream().map(h -> HistorialTicketResponse.builder()
                .idHistorial(h.getIdHistorial()).usuarioNombre(h.getUsuario() != null ? h.getUsuario().getNombres() : "Sistema")
                .accion(h.getAccion()).detalle(h.getDetalle()).fechaAccion(h.getFechaAccion()).build()).collect(Collectors.toList());
    }

    private Ticket find(Integer id) { return tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado")); }
    private Usuario getUser(String email) { return email != null ? userRepo.findByCorreo(email).orElse(null) : null; }
    private Prioridad calcPri(Impacto i, Urgencia u) {
        if (i == Impacto.ALTO && u == Urgencia.ALTA) return Prioridad.CRITICA;
        if (i == Impacto.ALTO || u == Urgencia.ALTA) return Prioridad.ALTA;
        if (i == Impacto.BAJO && u == Urgencia.BAJA) return Prioridad.BAJA;
        return Prioridad.MEDIA;
    }
    private TicketResponse map(Ticket t) {
        return TicketResponse.builder()
                .idTicket(t.getIdTicket()).tipo(t.getTipo()).asunto(t.getAsunto()).descripcion(t.getDescripcion())
                .impacto(t.getImpacto() != null ? t.getImpacto().name() : null).urgencia(t.getUrgencia() != null ? t.getUrgencia().name() : null)
                .prioridad(t.getPrioridad() != null ? t.getPrioridad().name() : null).estado(t.getEstado() != null ? t.getEstado().name() : null)
                .areaNombre(t.getArea() != null ? t.getArea().getNombre() : null).ciNombre(t.getElementoConfiguracion() != null ? t.getElementoConfiguracion().getNombre() : null)
                .ipOrigen(t.getIpOrigen()).fechaCreacion(t.getFechaCreacion()).fechaLimiteResolucion(t.getFechaLimiteResolucion())
                .estadoSla(t.getEstadoSla() != null ? t.getEstadoSla().name() : null).build();
    }
}

