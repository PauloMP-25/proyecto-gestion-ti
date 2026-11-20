package com.hospital.servicedesk.asistencial.atencion.aplicacion.impl;

import com.hospital.servicedesk.asistencial.atencion.aplicacion.ContextoAtencionService;
import com.hospital.servicedesk.asistencial.atencion.aplicacion.ReportarProblemaService;
import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dominio.ObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dominio.objetivo.ResolutorObjetivoFalla;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ReportarProblemaSolicitud;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.EstadoTicket;
import com.hospital.servicedesk.entities.HistorialTicket;
import com.hospital.servicedesk.entities.Impacto;
import com.hospital.servicedesk.entities.Prioridad;
import com.hospital.servicedesk.entities.Ticket;
import com.hospital.servicedesk.entities.Urgencia;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialTicketRepository;
import com.hospital.servicedesk.repositories.TicketRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ReportarProblemaServiceImpl implements ReportarProblemaService {

    private final UsuarioRepository usuarioRepository;
    private final AreaRepository areaRepository;
    private final ElementoConfiguracionRepository elementoRepository;
    private final TicketRepository ticketRepository;
    private final HistorialTicketRepository historialTicketRepository;
    private final ContextoAtencionService contextoAtencionService;
    private final Map<ObjetivoFalla, ResolutorObjetivoFalla> resolutores;
    private final Clock clock;

    public ReportarProblemaServiceImpl(
            UsuarioRepository usuarioRepository,
            AreaRepository areaRepository,
            ElementoConfiguracionRepository elementoRepository,
            TicketRepository ticketRepository,
            HistorialTicketRepository historialTicketRepository,
            ContextoAtencionService contextoAtencionService,
            List<ResolutorObjetivoFalla> resolutoresLista,
            Clock clock
    ) {
        this.usuarioRepository = usuarioRepository;
        this.areaRepository = areaRepository;
        this.elementoRepository = elementoRepository;
        this.ticketRepository = ticketRepository;
        this.historialTicketRepository = historialTicketRepository;
        this.contextoAtencionService = contextoAtencionService;
        this.clock = clock;

        this.resolutores = new EnumMap<>(ObjetivoFalla.class);
        for (ResolutorObjetivoFalla resolutor : resolutoresLista) {
            this.resolutores.put(resolutor.getObjetivo(), resolutor);
        }

        // Falla temprano al arrancar si falta un resolutor para algún objetivo del enum (OCP)
        for (ObjetivoFalla obj : ObjetivoFalla.values()) {
            if (!this.resolutores.containsKey(obj)) {
                throw new IllegalStateException("Falta implementar ResolutorObjetivoFalla para el objetivo: " + obj);
            }
        }
    }

    @Override
    public Ticket reportar(ReportarProblemaSolicitud solicitud, String correoUsuario, String ipOrigen) {
        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario reportante no encontrado con correo: " + correoUsuario));

        ContextoAtencionRespuesta ctx = contextoAtencionService.resolver(ipOrigen, usuario);

        ResolutorObjetivoFalla resolutor = resolutores.get(solicitud.objetivo());
        if (resolutor == null) {
            throw new ReglaNegocioException("objetivo", "Objetivo de falla no soportado: " + solicitud.objetivo());
        }

        Integer idCiAfectado = resolutor.resolverEquipoAfectado(solicitud, ctx);
        ElementoConfiguracion ciAfectado = (idCiAfectado != null)
                ? elementoRepository.findById(idCiAfectado).orElse(null)
                : null;

        Area area = resolverAreaFinal(ctx, solicitud, usuario);

        ElementoConfiguracion ciOrigen = (ctx.equipo() != null)
                ? elementoRepository.findById(ctx.equipo().id()).orElse(null)
                : null;

        Prioridad prioridad = calcularPrioridad(solicitud.impacto(), solicitud.urgencia());
        int horasSla = (prioridad == Prioridad.CRITICA) ? 2 : (prioridad == Prioridad.ALTA ? 4 : 8);
        LocalDateTime ahora = LocalDateTime.now(clock);

        Ticket ticket = Ticket.builder()
                .tipo(solicitud.tipo())
                .asunto(solicitud.asunto())
                .descripcion(solicitud.descripcion())
                .impacto(solicitud.impacto())
                .urgencia(solicitud.urgencia())
                .prioridad(prioridad)
                .estado(EstadoTicket.ABIERTO)
                .area(area)
                .elementoConfiguracion(ciAfectado != null ? ciAfectado : ciOrigen)
                .usuarioReporta(usuario)
                .ipOrigen(ipOrigen)
                .fechaLimiteResolucion(ahora.plusHours(horasSla))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();

        ticket = ticketRepository.save(ticket);

        String ubicacionFisica = (ctx.equipo() != null)
                ? ctx.equipo().codigoInventario() + " (" + area.getNombre() + ")"
                : "IP " + ipOrigen + " (" + area.getNombre() + ")";

        String detalle = String.format("Reportado por %s desde %s", usuario.getNombreVisible(), ubicacionFisica);

        HistorialTicket audit = HistorialTicket.builder()
                .ticket(ticket)
                .accion("CREACION")
                .detalle(detalle)
                .usuario(usuario)
                .fechaAccion(ahora)
                .build();

        historialTicketRepository.save(audit);

        return ticket;
    }

    private Area resolverAreaFinal(ContextoAtencionRespuesta ctx, ReportarProblemaSolicitud solicitud, Usuario usuario) {
        if (ctx.estadoDeteccion() == EstadoDeteccion.DETECTADO && ctx.area() != null) {
            return areaRepository.findById(ctx.area().id())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Área detectada no encontrada: " + ctx.area().id()));
        }

        if (solicitud.idAreaManual() != null) {
            Area manual = areaRepository.findById(solicitud.idAreaManual())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + solicitud.idAreaManual()));
            if (!Boolean.TRUE.equals(manual.getActivo())) {
                throw new ReglaNegocioException("idAreaManual", "No se pueden reportar problemas en un área desactivada");
            }
            return manual;
        }

        if (usuario.getArea() != null && Boolean.TRUE.equals(usuario.getArea().getActivo())) {
            return usuario.getArea();
        }

        throw new ReglaNegocioException("idAreaManual", "No se detectó el equipo; debe seleccionar el área donde ocurre la falla");
    }

    private Prioridad calcularPrioridad(Impacto imp, Urgencia urg) {
        if (imp == Impacto.ALTO && urg == Urgencia.ALTA) return Prioridad.CRITICA;
        if (imp == Impacto.ALTO || urg == Urgencia.ALTA) return Prioridad.ALTA;
        if (imp == Impacto.BAJO && urg == Urgencia.BAJA) return Prioridad.BAJA;
        return Prioridad.MEDIA;
    }
}
