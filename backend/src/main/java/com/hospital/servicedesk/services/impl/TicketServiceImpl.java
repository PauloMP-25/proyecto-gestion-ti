
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
import java.util.Map;
import java.util.HashMap;
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
    private final ElementoConfiguracionRepository ciRepo;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest req, String clientIp) {
        Area area = null; ElementoConfiguracion ci = null;
        if (clientIp != null && !clientIp.isBlank()) {
            if ("0:0:0:0:0:0:0:1".equals(clientIp) || "::1".equals(clientIp)) clientIp = "127.0.0.1";
            Optional<HistorialAsignacionIP> assignment = ipRepo.findActiveAssignmentByIp(clientIp);
            if (assignment.isPresent()) { ci = assignment.get().getElementoConfiguracion(); if (ci != null) area = ci.getArea(); }
        }
        if (area == null) {
            area = areaRepo.findAll().stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay áreas configuradas"));
        }

        Prioridad pri = calcPri(req.getImpacto(), req.getUrgencia());

        Ticket ticket = Ticket.builder()
                .tipo(req.getTipo())
                .asunto(req.getAsunto())
                .descripcion(req.getDescripcion())
                .impacto(req.getImpacto())
                .urgencia(req.getUrgencia())
                .prioridad(pri)
                .estado(EstadoTicket.ABIERTO)
                .area(area)
                .elementoConfiguracion(ci)
                .ipOrigen(clientIp)
                .fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();

        ticket = tRepo.save(ticket);

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(ticket)
                .accion("CREACION")
                .detalle("Ticket creado desde IP: " + clientIp)
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(ticket);
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        return tRepo.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getMisTickets(String userEmail) {
        return tRepo.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    public TicketResponse getTicketById(Integer id) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        return map(t);
    }

    @Override
    public List<Object> getHistorialTicket(Integer id) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        return auditRepo.findByTicketIdTicket(id).stream().map(h -> (Object) h).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Integer id, AssignRequest req, String userEmail) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        Usuario tech = userRepo.findById(req.getTecnicoId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Técnico no encontrado"));
        t.setTecnicoAsignado(tech);
        t.setEstado(EstadoTicket.EN_PROGRESO);
        t = tRepo.save(t);

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("ASIGNACION")
                .detalle("Ticket asignado al técnico: " + tech.getCorreo())
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse tomarTicket(Integer id, String userEmail) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        if (userEmail != null) {
            userRepo.findByCorreo(userEmail).ifPresent(t::setTecnicoAsignado);
        }
        t.setEstado(EstadoTicket.EN_PROGRESO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse iniciarTicket(Integer id) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        t.setEstado(EstadoTicket.EN_PROGRESO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse escalarTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        t.setEstado(EstadoTicket.ESCALADO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse resolverTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        t.setEstado(EstadoTicket.RESUELTO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse cerrarTicket(Integer id) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        t.setEstado(EstadoTicket.CERRADO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse reabrirTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        t.setEstado(EstadoTicket.ABIERTO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse registrarConformidad(Integer id, Map<String, Object> req) {
        return getTicketById(id);
    }

    @Override
    @Transactional
    public TicketResponse registrarEncuesta(Integer id, Map<String, Object> req) {
        return getTicketById(id);
    }

    @Override
    @Transactional
    public TicketResponse vincularEquipo(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket no encontrado"));
        if (req.get("idCi") != null) {
            Integer idCi = (Integer) req.get("idCi");
            ciRepo.findById(idCi).ifPresent(t::setElementoConfiguracion);
            t = tRepo.save(t);
        }
        return map(t);
    }

    @Override
    public Map<String, Object> getContextoCliente(String clientIp) {
        if ("0:0:0:0:0:0:0:1".equals(clientIp) || "::1".equals(clientIp)) clientIp = "127.0.0.1";
        Map<String, Object> ctx = new HashMap<>();
        ctx.put("ipOrigen", clientIp);
        Optional<HistorialAsignacionIP> assignment = ipRepo.findActiveAssignmentByIp(clientIp);
        if (assignment.isPresent() && assignment.get().getElementoConfiguracion() != null) {
            ElementoConfiguracion ci = assignment.get().getElementoConfiguracion();
            ctx.put("idCi", ci.getIdCi());
            ctx.put("nombreEquipo", ci.getNombre());
            ctx.put("tipoCi", ci.getTipoCi() != null ? ci.getTipoCi().name() : null);
            if (ci.getArea() != null) {
                ctx.put("idArea", ci.getArea().getIdArea());
                ctx.put("areaNombre", ci.getArea().getNombre());
            }
        } else {
            ctx.put("nombreEquipo", "Equipo Genérico");
            Area defaultArea = areaRepo.findAll().stream().findFirst().orElse(null);
            if (defaultArea != null) {
                ctx.put("idArea", defaultArea.getIdArea());
                ctx.put("areaNombre", defaultArea.getNombre());
            }
        }
        return ctx;
    }

    private Prioridad calcPri(Impacto imp, Urgencia urg) {
        if (imp == Impacto.ALTO && urg == Urgencia.ALTA) return Prioridad.CRITICA;
        if (imp == Impacto.ALTO || urg == Urgencia.ALTA) return Prioridad.ALTA;
        if (imp == Impacto.BAJO && urg == Urgencia.BAJA) return Prioridad.BAJA;
        return Prioridad.MEDIA;
    }

    private TicketResponse map(Ticket t) {
        return TicketResponse.builder()
                .idTicket(t.getIdTicket())
                .tipo(t.getTipo())
                .asunto(t.getAsunto())
                .descripcion(t.getDescripcion())
                .impacto(t.getImpacto() != null ? t.getImpacto().name() : null)
                .urgencia(t.getUrgencia() != null ? t.getUrgencia().name() : null)
                .prioridad(t.getPrioridad() != null ? t.getPrioridad().name() : null)
                .estado(t.getEstado() != null ? t.getEstado().name() : null)
                .areaNombre(t.getArea() != null ? t.getArea().getNombre() : null)
                .ciNombre(t.getElementoConfiguracion() != null ? t.getElementoConfiguracion().getNombre() : null)
                .ipOrigen(t.getIpOrigen())
                .fechaCreacion(t.getFechaCreacion())
                .fechaLimiteResolucion(t.getFechaLimiteResolucion())
                .estadoSla(t.getEstadoSla() != null ? t.getEstadoSla().name() : null)
                .build();
    }
}

