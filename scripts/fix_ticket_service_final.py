# 1. Write clean TicketServiceImpl with @Autowired constructor
svc_path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
svc_code = """package com.hospital.servicedesk.services.impl;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TicketServiceImpl implements TicketService {

    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIpRepository ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;
    private final AuditoriaTicketService auditoriaTicketService;
    private final ApplicationEventPublisher eventos;

    @Autowired
    public TicketServiceImpl(TicketRepository tRepo, AreaRepository areaRepo, HistorialAsignacionIpRepository ipRepo,
                             HistorialTicketRepository auditRepo, UsuarioRepository userRepo, ElementoConfiguracionRepository ciRepo,
                             PoliticaCompromisoAtencion politicaCompromiso, Clock clock,
                             AuditoriaTicketService auditoriaTicketService, ApplicationEventPublisher eventos) {
        this.tRepo = tRepo;
        this.areaRepo = areaRepo;
        this.ipRepo = ipRepo;
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
        this.ciRepo = ciRepo;
        this.politicaCompromiso = politicaCompromiso;
        this.clock = clock;
        this.auditoriaTicketService = auditoriaTicketService;
        this.eventos = eventos;
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
    public List<HistorialTicketResponse> getTicketHistory(Integer id) {
        return auditRepo.findByTicketIdTicketOrderByFechaAccionAsc(id).stream().map(h ->
                HistorialTicketResponse.builder()
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
with open(svc_path, "w", encoding="utf-8") as f:
    f.write(svc_code)
print("Wrote clean TicketServiceImpl")

# 2. Update TicketServiceTest & SlaAndAuditServiceTest to provide mocks
def update_test(path):
    with open(path, "r", encoding="utf-8") as f:
        code = f.read()
    if "PoliticaCompromisoAtencion" not in code:
        code = code.replace("import org.mockito.Mock;", "import org.mockito.Mock;\nimport com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;\nimport com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;\nimport org.springframework.context.ApplicationEventPublisher;\nimport java.time.Clock;\nimport java.time.LocalDateTime;")
        mock_block = """    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private AreaRepository areaRepository;

    @Mock
    private HistorialAsignacionIpRepository ipRepo;

    @Mock
    private HistorialTicketRepository auditRepo;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PoliticaCompromisoAtencion politicaCompromiso;

    @Mock
    private Clock clock;

    @Mock
    private AuditoriaTicketService auditoriaTicketService;

    @Mock
    private ApplicationEventPublisher eventos;
"""
        code = code.replace("    @Mock\n    private TicketRepository ticketRepository;\n\n    @Mock\n    private AreaRepository areaRepository;\n\n    @Mock\n    private HistorialAsignacionIpRepository ipRepo;\n\n    @Mock\n    private HistorialTicketRepository auditRepo;\n\n    @Mock\n    private UsuarioRepository usuarioRepository;", mock_block)
        
        setup_mock = """        when(clock.instant()).thenReturn(java.time.Instant.now());
        when(clock.getZone()).thenReturn(java.time.ZoneId.systemDefault());
        when(politicaCompromiso.calcularLimite(any(), any(), any(), any())).thenReturn(LocalDateTime.now().plusHours(2));
"""
        code = code.replace("MockitoAnnotations.openMocks(this);", "MockitoAnnotations.openMocks(this);\n" + setup_mock)
        with open(path, "w", encoding="utf-8") as f:
            f.write(code)
        print(f"Updated test {path}")

update_test("backend/src/test/java/com/hospital/servicedesk/services/TicketServiceTest.java")
update_test("backend/src/test/java/com/hospital/servicedesk/services/SlaAndAuditServiceTest.java")
