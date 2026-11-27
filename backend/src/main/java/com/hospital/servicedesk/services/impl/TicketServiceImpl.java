package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import java.time.Clock;


import com.hospital.servicedesk.dtos.TicketDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;

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
                .fechaCreacion(LocalDateTime.now(clock))
                .fechaLimiteResolucion(politicaCompromiso.calcularLimite(LocalDateTime.now(clock), req.getImpacto(), req.getUrgencia(), pri))
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
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse> getTicketsPaginados(
            int pagina,
            int tamano,
            String estado,
            String prioridad,
            Integer idArea,
            String texto) {
        return getTicketsPaginados(pagina, tamano, estado, prioridad, idArea, texto, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse> getTicketsPaginados(
            int pagina,
            int tamano,
            String estado,
            String prioridad,
            Integer idArea,
            String texto,
            String asignadoA,
            String estados,
            String prioridades,
            String userEmail) {
        return getTicketsPaginados(pagina, tamano, estado, prioridad, idArea, texto, asignadoA, estados, prioridades, userEmail, null);
    }

    @Override
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse> getTicketsPaginados(
            int pagina,
            int tamano,
            String estado,
            String prioridad,
            Integer idArea,
            String texto,
            String asignadoA,
            String estados,
            String prioridades,
            String userEmail,
            Boolean misSolicitudes) {
        boolean esUsuarioFinal = false;
        if (userEmail != null && !userEmail.isBlank()) {
            Usuario u = userRepo.findByCorreoIgnoreCase(userEmail)
                    .or(() -> userRepo.findByNombreUsuario(userEmail))
                    .orElse(null);
            if (u != null && "USUARIO_FINAL".equalsIgnoreCase(u.getRol())) {
                esUsuarioFinal = true;
            }
        }

        List<Ticket> todos = tRepo.findAll();

        boolean soloMios = esUsuarioFinal || Boolean.TRUE.equals(misSolicitudes);

        List<TicketResponse> filtrados = todos.stream()
                .filter(t -> {
                    // RLS: usuario final o misSolicitudes solo accede a sus propios tickets
                    if (soloMios) {
                        if (t.getUsuarioReporta() == null || userEmail == null
                                || !userEmail.equalsIgnoreCase(t.getUsuarioReporta().getCorreo())) {
                            return false;
                        }
                    }

                    // Filtro de asignadoA: 'sinAsignar' o 'me'
                    if (asignadoA != null && !asignadoA.isBlank()) {
                        if ("sinAsignar".equalsIgnoreCase(asignadoA)) {
                            if (t.getTecnicoAsignado() != null) return false;
                        } else if ("me".equalsIgnoreCase(asignadoA)) {
                            if (userEmail == null || t.getTecnicoAsignado() == null || !userEmail.equalsIgnoreCase(t.getTecnicoAsignado().getCorreo())) {
                                return false;
                            }
                        }
                    }

                    // Filtro de múltiples estados (ej: "ASIGNADO,EN_PROCESO,REABIERTO")
                    if (estados != null && !estados.isBlank()) {
                        List<String> listEstados = java.util.Arrays.stream(estados.split(","))
                                .map(String::trim)
                                .map(String::toUpperCase)
                                .toList();
                        String estadoActual = t.getEstado() != null ? t.getEstado().name() : "";
                        boolean coincide = listEstados.contains(estadoActual)
                                || (listEstados.contains("NUEVO") && t.getEstado() == EstadoTicket.ABIERTO)
                                || (listEstados.contains("ASIGNADO") && t.getEstado() == EstadoTicket.EN_PROGRESO)
                                || (listEstados.contains("EN_PROCESO") && t.getEstado() == EstadoTicket.EN_PROGRESO)
                                || (listEstados.contains("REABIERTO") && t.getEstado() == EstadoTicket.ABIERTO);
                        if (!coincide) return false;
                    } else if (estado != null && !estado.isBlank() && !estado.equalsIgnoreCase("TODAS")) {
                        if (t.getEstado() == null || !t.getEstado().name().equalsIgnoreCase(estado)) {
                            boolean matchAlias = ("NUEVO".equalsIgnoreCase(estado) && t.getEstado() == EstadoTicket.ABIERTO)
                                    || ("EN_PROCESO".equalsIgnoreCase(estado) && t.getEstado() == EstadoTicket.EN_PROGRESO);
                            if (!matchAlias) return false;
                        }
                    }

                    // Filtro de múltiples prioridades o prioridad individual
                    if (prioridades != null && !prioridades.isBlank()) {
                        List<String> listP = java.util.Arrays.stream(prioridades.split(","))
                                .map(String::trim)
                                .map(String::toUpperCase)
                                .toList();
                        String pActual = t.getPrioridad() != null ? t.getPrioridad().name() : "";
                        boolean match = listP.contains(pActual)
                                || (listP.contains("P1_CRITICA") && "CRITICA".equalsIgnoreCase(pActual))
                                || (listP.contains("P2_ALTA") && "ALTA".equalsIgnoreCase(pActual))
                                || (listP.contains("P3_MEDIA") && "MEDIA".equalsIgnoreCase(pActual))
                                || (listP.contains("P4_BAJA") && "BAJA".equalsIgnoreCase(pActual));
                        if (!match) return false;
                    } else if (prioridad != null && !prioridad.isBlank()) {
                        if (t.getPrioridad() == null) return false;
                        String priName = t.getPrioridad().name();
                        boolean match = priName.equalsIgnoreCase(prioridad)
                                || ("P1".equalsIgnoreCase(prioridad) && "CRITICA".equalsIgnoreCase(priName))
                                || ("P2".equalsIgnoreCase(prioridad) && "ALTA".equalsIgnoreCase(priName))
                                || ("P3".equalsIgnoreCase(prioridad) && "MEDIA".equalsIgnoreCase(priName))
                                || ("P4".equalsIgnoreCase(prioridad) && "BAJA".equalsIgnoreCase(priName));
                        if (!match) return false;
                    }

                    if (idArea != null && idArea > 0) {
                        if (t.getArea() == null || !idArea.equals(t.getArea().getIdArea())) return false;
                    }
                    if (texto != null && !texto.isBlank()) {
                        String txtLower = texto.toLowerCase().trim();
                        boolean coincideAsunto = t.getAsunto() != null && t.getAsunto().toLowerCase().contains(txtLower);
                        boolean coincideDesc = t.getDescripcion() != null && t.getDescripcion().toLowerCase().contains(txtLower);
                        boolean coincideId = String.valueOf(t.getIdTicket()).contains(txtLower);
                        if (!coincideAsunto && !coincideDesc && !coincideId) return false;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    LocalDateTime fA = a.getFechaCreacion() != null ? a.getFechaCreacion() : LocalDateTime.MIN;
                    LocalDateTime fB = b.getFechaCreacion() != null ? b.getFechaCreacion() : LocalDateTime.MIN;
                    return fB.compareTo(fA);
                })
                .map(this::map)
                .toList();

        return com.hospital.servicedesk.dtos.PaginaRespuesta.of(filtrados, pagina, tamano);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getResumenTurno(String userEmail) {
        List<Ticket> todos = tRepo.findAll();
        long asignados = todos.stream()
                .filter(t -> userEmail != null && t.getTecnicoAsignado() != null && userEmail.equalsIgnoreCase(t.getTecnicoAsignado().getCorreo()))
                .filter(t -> t.getEstado() == EstadoTicket.EN_PROGRESO || t.getEstado() == EstadoTicket.ABIERTO)
                .count();

        long porVencer = todos.stream()
                .filter(t -> t.getEstadoSla() == EstadoSLA.POR_VENCER)
                .count();

        long vencidos = todos.stream()
                .filter(t -> t.getEstadoSla() == EstadoSLA.VENCIDO)
                .count();

        long resueltosHoy = todos.stream()
                .filter(t -> t.getEstado() == EstadoTicket.RESUELTO)
                .count();

        boolean hayP1SinTomar = todos.stream()
                .anyMatch(t -> t.getPrioridad() == Prioridad.CRITICA && t.getTecnicoAsignado() == null && t.getEstado() == EstadoTicket.ABIERTO);

        Map<String, Object> res = new HashMap<>();
        res.put("asignados", asignados);
        res.put("porVencer", porVencer);
        res.put("vencidos", vencidos);
        res.put("resueltosHoy", resueltosHoy);
        res.put("hayP1SinTomar", hayP1SinTomar);
        res.put("ahoraServidorIso", LocalDateTime.now().toString());
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public long contarPorConfirmar(String userEmail) {
        return tRepo.findAll().stream()
                .filter(t -> t.getEstado() == EstadoTicket.RESUELTO)
                .filter(t -> {
                    if (userEmail == null || userEmail.isBlank()) return true;
                    return t.getUsuarioReporta() != null && userEmail.equalsIgnoreCase(t.getUsuarioReporta().getCorreo());
                })
                .count();
    }

    @Override
    public List<TicketResponse> getMisTickets(String userEmail) {
        return tRepo.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<TicketResponse> getMisTicketsPaginados(String userEmail, int pagina, int tamano) {
        List<Ticket> todos = tRepo.findAll();
        List<TicketResponse> mis = todos.stream()
                .filter(t -> {
                    if (userEmail == null || userEmail.isBlank()) return true;
                    return t.getTecnicoAsignado() != null && userEmail.equalsIgnoreCase(t.getTecnicoAsignado().getCorreo());
                })
                .sorted((a, b) -> {
                    LocalDateTime fA = a.getFechaCreacion() != null ? a.getFechaCreacion() : LocalDateTime.MIN;
                    LocalDateTime fB = b.getFechaCreacion() != null ? b.getFechaCreacion() : LocalDateTime.MIN;
                    return fB.compareTo(fA);
                })
                .map(this::map)
                .toList();

        return com.hospital.servicedesk.dtos.PaginaRespuesta.of(mis, pagina, tamano);
    }

    @Override
    public TicketResponse getTicketById(Integer id) {
        return getTicketById(id, null);
    }

    @Override
    public TicketResponse getTicketById(Integer id, String userEmail) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        if (userEmail != null && !userEmail.isBlank()) {
            Usuario u = userRepo.findByCorreoIgnoreCase(userEmail)
                    .or(() -> userRepo.findByNombreUsuario(userEmail))
                    .orElse(null);
            if (u != null && "USUARIO_FINAL".equalsIgnoreCase(u.getRol())) {
                if (t.getUsuarioReporta() == null || !userEmail.equalsIgnoreCase(t.getUsuarioReporta().getCorreo())) {
                    throw new org.springframework.security.access.AccessDeniedException("No tiene permisos para acceder a esta solicitud");
                }
            }
        }
        return map(t);
    }

    @Override
    public List<Object> getHistorialTicket(Integer id) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        return auditRepo.findByTicketIdTicket(id).stream().map(h -> (Object) h).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Integer id, AssignRequest req, String userEmail) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        Usuario tech = userRepo.findById(req.getTecnicoId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Técnico", req.getTecnicoId()));
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
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
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
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        t.setEstado(EstadoTicket.EN_PROGRESO);
        t = tRepo.save(t);
        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse escalarTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        t.setEstado(EstadoTicket.ESCALADO);
        t.setTecnicoAsignado(null);
        t = tRepo.save(t);

        String motivo = req != null && req.get("motivo") != null ? req.get("motivo").toString() : "Derivado a Soporte Nivel 2";
        String detalles = req != null && req.get("detallesTecnicos") != null ? req.get("detallesTecnicos").toString() : null;
        String detalleAudit = "Ticket derivado a Soporte Nivel 2. Motivo: " + motivo;
        if (detalles != null && !detalles.isBlank()) {
            detalleAudit += " | Pruebas realizadas: " + detalles;
        }

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("ESCALAMIENTO")
                .detalle(detalleAudit)
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse resolverTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        t.setEstado(EstadoTicket.RESUELTO);
        t = tRepo.save(t);

        String solucion = req != null && req.get("solucion") != null 
                ? req.get("solucion").toString() 
                : (req != null && req.get("diagnostico") != null ? req.get("diagnostico").toString() : "Problema resuelto satisfactoriamente.");
        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("RESOLUCION")
                .detalle("Ticket resuelto. Detalle técnico: " + solucion)
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse cerrarTicket(Integer id) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        t.setEstado(EstadoTicket.CERRADO);
        t = tRepo.save(t);

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("CIERRE")
                .detalle("Ticket cerrado formalmente en el sistema.")
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse reabrirTicket(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
        t.setEstado(EstadoTicket.ABIERTO);
        t = tRepo.save(t);

        String motivo = req != null && req.get("motivo") != null ? req.get("motivo").toString() : "Reapertura de ticket por disconformidad";
        HistorialTicket audit = HistorialTicket.builder()
                .ticket(t)
                .accion("REAPERTURA")
                .detalle("Ticket reabierto. Motivo indicado: " + motivo)
                .fechaAccion(LocalDateTime.now())
                .build();
        auditRepo.save(audit);

        return map(t);
    }

    @Override
    @Transactional
    public TicketResponse registrarConformidad(Integer id, Map<String, Object> req) {
        return cerrarTicket(id);
    }

    @Override
    @Transactional
    public TicketResponse registrarEncuesta(Integer id, Map<String, Object> req) {
        return getTicketById(id);
    }

    @Override
    @Transactional
    public TicketResponse vincularEquipo(Integer id, Map<String, Object> req) {
        Ticket t = tRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Ticket", id));
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
                .tecnicoId(t.getTecnicoAsignado() != null ? t.getTecnicoAsignado().getIdUsuario() : null)
                .tecnicoNombre(t.getTecnicoAsignado() != null ? t.getTecnicoAsignado().getNombreVisible() : null)
                .solicitanteNombre(t.getUsuarioReporta() != null ? t.getUsuarioReporta().getNombreVisible() : "Personal Asistencial")
                .build();
    }
}
