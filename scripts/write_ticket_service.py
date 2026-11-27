path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
content = """package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;
import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.TicketCriticoRegistradoEvento;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIP ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;
    private final AuditoriaTicketService auditoriaTicketService;
    private final ApplicationEventPublisher eventos;

    public TicketServiceImpl(TicketRepository tRepo, AreaRepository areaRepo, HistorialAsignacionIP ipRepo,
                             HistorialTicketRepository auditRepo, UsuarioRepository userRepo, ElementoConfiguracionRepository ciRepo) {
        this.tRepo = tRepo;
        this.areaRepo = areaRepo;
        this.ipRepo = ipRepo;
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
        this.ciRepo = ciRepo;
        this.politicaCompromiso = null;
        this.clock = Clock.systemDefaultZone();
        this.auditoriaTicketService = null;
        this.eventos = null;
    }

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest req, String clientIp) {
        Area area = null;
        ElementoConfiguracion ci = null;
        if (clientIp != null && !clientIp.isBlank()) {
            if ("0:0:0:0:0:0:0:1".equals(clientIp) || "::1".equals(clientIp)) clientIp = "127.0.0.1";
            Optional<HistorialAsignacionIP> assignment = ipRepo.findActiveAssignmentByIp(clientIp);
            if (assignment.isPresent()) {
                ci = assignment.get().getElementoConfiguracion();
                if (ci != null) area = ci.getArea();
            }
        }
        if (area == null) {
            area = areaRepo.findAll().stream().findFirst()
                    .orElseThrow(() -> new ReglaNegocioException("No hay áreas configuradas en el sistema hospitalario"));
        }

        Prioridad pri = calcPri(req.getImpacto(), req.getUrgencia());
        LocalDateTime ahora = clock != null ? LocalDateTime.now(clock) : LocalDateTime.now();
        LocalDateTime limite = politicaCompromiso != null ?
                politicaCompromiso.calcularLimite(ahora, req.getImpacto(), req.getUrgencia(), pri) :
                ahora.plusHours(pri == Prioridad.CRITICA ? 2 : 8);

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
                .fechaCreacion(ahora)
                .fechaLimiteResolucion(limite)
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();

        ticket = tRepo.save(ticket);

        if (auditoriaTicketService != null) {
            try {
                auditoriaTicketService.registrar(RegistroAuditoriaTicket.builder()
                        .ticket(ticket)
                        .actor(null)
                        .accion("CREACION")
                        .estadoNuevo(EstadoTicket.ABIERTO.name())
                        .detalle("Ticket creado desde IP: " + clientIp)
                        .ipOrigen(clientIp)
                        .build());
            } catch (Exception ignored) {}
        }

        if (pri == Prioridad.CRITICA && eventos != null) {
            try {
                eventos.publishEvent(TicketCriticoRegistradoEvento.desde(ticket));
            } catch (Exception ignored) {}
        }

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(ticket)
                .accion("CREAR")
                .detalle("Ticket creado exitosamente")
                .fechaAccion(ahora)
                .build();
        auditRepo.save(audit);

        return mapToResponse(ticket);
    }

    private Prioridad calcPri(Impacto imp, Urgencia urg) {
        if (imp == Impacto.CRITICO || urg == Urgencia.CRITICA) return Prioridad.CRITICA;
        if (imp == Impacto.ALTO || urg == Urgencia.ALTA) return Prioridad.ALTA;
        if (imp == Impacto.MEDIO || urg == Urgencia.MEDIA) return Prioridad.MEDIA;
        return Prioridad.BAJA;
    }

    private TicketResponse mapToResponse(Ticket t) {
        return TicketResponse.builder()
                .idTicket(t.getIdTicket())
                .tipo(t.getTipo())
                .asunto(t.getAsunto())
                .descripcion(t.getDescripcion())
                .impacto(t.getImpacto())
                .urgencia(t.getUrgencia())
                .prioridad(t.getPrioridad())
                .estado(t.getEstado())
                .idArea(t.getArea().getIdArea())
                .nombreArea(t.getArea().getNombre())
                .idElementoConfiguracion(t.getElementoConfiguracion() != null ? t.getElementoConfiguracion().getIdElemento() : null)
                .nombreElementoConfiguracion(t.getElementoConfiguracion() != null ? t.getElementoConfiguracion().getNombre() : null)
                .fechaCreacion(t.getFechaCreacion())
                .fechaLimiteResolucion(t.getFechaLimiteResolucion())
                .estadoSla(t.getEstadoSla())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        return tRepo.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Integer id) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Ticket no encontrado: " + id));
        return mapToResponse(t);
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(Integer id, EstadoTicket nuevoEstado, String detalle, String ip) {
        Ticket t = tRepo.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Ticket no encontrado: " + id));
        EstadoTicket anterior = t.getEstado();
        t.setEstado(nuevoEstado);
        t = tRepo.save(t);

        LocalDateTime ahora = clock != null ? LocalDateTime.now(clock) : LocalDateTime.now();
        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("CAMBIO_ESTADO")
                .estadoAnterior(anterior.name())
                .estadoNuevo(nuevoEstado.name())
                .motivo(detalle)
                .ipOrigen(ip)
                .detalle("Estado cambiado de " + anterior + " a " + nuevoEstado)
                .fechaAccion(ahora)
                .build();
        auditRepo.save(audit);

        return mapToResponse(t);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketHistoryResponse> getTicketHistory(Integer id) {
        return auditRepo.findByTicketIdTicketOrderByFechaAccionAsc(id).stream().map(h ->
                TicketHistoryResponse.builder()
                        .idHistorial(h.getIdHistorial())
                        .idTicket(h.getTicket().getIdTicket())
                        .accion(h.getAccion())
                        .detalle(h.getDetalle())
                        .fechaAccion(h.getFechaAccion())
                        .build()
        ).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getTicketStats() {
        List<Ticket> all = tRepo.findAll();
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", (long) all.size());
        stats.put("abiertos", all.stream().filter(t -> t.getEstado() == EstadoTicket.ABIERTO).count());
        stats.put("enProgreso", all.stream().filter(t -> t.getEstado() == EstadoTicket.EN_PROGRESO).count());
        stats.put("resueltos", all.stream().filter(t -> t.getEstado() == EstadoTicket.RESUELTO).count());
        stats.put("cerrados", all.stream().filter(t -> t.getEstado() == EstadoTicket.CERRADO).count());
        return stats;
    }
}
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewrote TicketServiceImpl successfully")
