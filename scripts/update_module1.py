import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 1. DTOs
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dto/SolicitudCambioDTOs.java", """package com.hospital.servicedesk.administrativo.cambios.dto;

import com.hospital.servicedesk.entities.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class SolicitudCambioDTOs {

    private SolicitudCambioDTOs() {}

    public record HorarioProgramado(
            @NotNull(message = "Indique la fecha y hora de inicio.") LocalDateTime inicioIso,
            @NotNull(message = "Indique la fecha y hora de fin.") LocalDateTime finIso) {}

    public record PasoPlanFormulario(
            @NotBlank(message = "Describa el paso.")
            @Size(max = 500, message = "Cada paso admite hasta 500 caracteres.") String descripcion,
            @Size(max = 120) String responsable,
            @Positive(message = "Los minutos estimados deben ser mayores a cero.")
            @Max(value = 1440, message = "Un paso no puede durar más de 24 horas.") Integer minutosEstimados) {}

    public record EvaluacionImpactoFormulario(
            @NotNull(message = "Seleccione el nivel de impacto asistencial.") ImpactoAsistencial nivel,
            @NotEmpty(message = "Seleccione al menos un área del hospital afectada.")
            List<@NotNull Integer> idsAreasAfectadas,
            @NotNull(message = "Indique si el cambio requiere interrupción de servicios.") Boolean requiereInterrupcion,
            @PositiveOrZero Integer minutosInterrupcion,
            @Size(max = 500) String pacientesAfectados,
            @NotBlank(message = "Describa el impacto esperado.")
            @Size(max = 2000, message = "Máximo 2000 caracteres.") String descripcionImpacto) {}

    public record PlanReversaFormulario(
            @NotBlank(message = "El criterio de reversa es obligatorio.")
            @Size(max = 500) String criterioActivacion,
            @NotEmpty(message = "El plan de reversa debe tener al menos un paso.")
            List<@NotNull @Valid PasoPlanFormulario> pasos,
            @NotNull @Positive(message = "Indique los minutos estimados para la reversa.") Integer minutosEstimados,
            @Size(max = 1000) String planContinuidad,
            @NotBlank(message = "Indique el responsable de reversa.")
            @Size(max = 120) String responsableReversa) {}

    public record SolicitudCambioFormulario(
            @NotBlank(message = "El título es obligatorio.")
            @Size(max = 120, message = "Máximo 120 caracteres.") String titulo,
            @NotNull(message = "Seleccione el tipo de cambio.") TipoCambio tipo,
            @NotNull(message = "Seleccione la categoría.") CategoriaCambio categoria,
            @NotBlank(message = "La descripción técnica es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String descripcion,
            @NotBlank(message = "La justificación de negocio es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String justificacion,
            @Size(max = 120) String responsableEjecucion,
            @Valid HorarioProgramado horario,
            @NotNull @Valid EvaluacionImpactoFormulario evaluacion,
            List<@NotBlank @Size(max = 150) String> serviciosAfectados,
            List<@NotBlank @Size(max = 30) String> equiposAfectados,
            @NotEmpty(message = "Agregue al menos un paso de implementación.")
            List<@NotNull @Valid PasoPlanFormulario> pasosImplementacion,
            @NotNull @Valid PlanReversaFormulario planReversa,
            Integer idTicketOrigen) {}

    public record TransicionCambioSolicitud(
            @NotNull(message = "Indique la acción a realizar.") AccionCambio accion,
            @Size(max = 1000, message = "La observación no puede superar los 1000 caracteres.") String observacion) {}

    public record AreaAfectadaRespuesta(Integer idArea, String nombre, boolean esCritica) {}

    public record PasoPlanRespuesta(int orden, String descripcion, String responsable, Integer minutosEstimados) {}

    public record EvaluacionImpactoRespuesta(
            ImpactoAsistencial nivel,
            List<AreaAfectadaRespuesta> areasAfectadas,
            boolean requiereInterrupcion,
            Integer minutosInterrupcion,
            List<String> serviciosAfectados,
            String pacientesPotencialmenteAfectados,
            String descripcion) {}

    public record PlanReversaRespuesta(
            String criterioActivacion,
            List<PasoPlanRespuesta> pasos,
            Integer minutosEstimados,
            String planContinuidad,
            String responsableReversa) {}

    public record EventoCambioRespuesta(
            LocalDateTime fechaIso,
            String usuarioNombre,
            EstadoCambio estadoAnterior,
            EstadoCambio estadoNuevo,
            String observacion) {}

    public record CambioResumenRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso) {}

    public record CambioDetalleRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso,
            String descripcion,
            String justificacion,
            List<String> equiposAfectados,
            Integer idTicketOrigen,
            EvaluacionImpactoRespuesta evaluacion,
            List<PasoPlanRespuesta> pasosImplementacion,
            PlanReversaRespuesta planReversa,
            String aprobador,
            LocalDateTime fechaDecisionIso,
            String observacionDecision,
            String resultadoImplementacion,
            LocalDateTime fechaInicioRealIso,
            LocalDateTime fechaFinRealIso,
            List<EventoCambioRespuesta> historial,
            List<AccionCambio> accionesPermitidas,
            List<String> advertencias,
            Long version) {}
}
""")

# 2. Validador Domain helper esAreaCritica
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dominio/ValidadorSolicitudCambio.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.SolicitudCambioFormulario;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;

@Component
public class ValidadorSolicitudCambio {

    private final Clock clock;

    public ValidadorSolicitudCambio(Clock clock) {
        this.clock = clock;
    }

    public static boolean esAreaCritica(Area a) {
        return a.getPrioridadDefecto() != null && "P1".equalsIgnoreCase(a.getPrioridadDefecto());
    }

    public void validar(SolicitudCambioFormulario f) {
        LocalDateTime ahora = LocalDateTime.now(clock);

        if (f.horario() != null) {
            if (f.horario().inicioIso().isBefore(ahora)) {
                throw new ReglaNegocioException("horario", "La fecha de inicio programada no puede estar en el pasado.");
            }
            if (f.horario().finIso().isBefore(f.horario().inicioIso())) {
                throw new ReglaNegocioException("horario", "La fecha de fin programada debe ser posterior al inicio.");
            }
        }

        if (f.evaluacion().nivel().exigeContinuidad() && (f.planReversa().planContinuidad() == null || f.planReversa().planContinuidad().isBlank())) {
            throw new ReglaNegocioException("planContinuidad", "Los cambios con impacto alto o crítico exigen un plan de continuidad asistencial.");
        }
    }
}
""")

# 3. Service Interface
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/aplicacion/SolicitudCambioService.java", """package com.hospital.servicedesk.administrativo.cambios.aplicacion;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;

import java.util.List;

public interface SolicitudCambioService {
    List<CambioResumenRespuesta> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto);
    CambioDetalleRespuesta obtener(Integer id);
    CambioDetalleRespuesta crear(SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx);
    void eliminar(Integer id, ContextoActor ctx);
    List<AreaAfectadaRespuesta> listarAreasSeleccionables();
}
""")

# 4. Mapper
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/mapper/SolicitudCambioMapper.java", """package com.hospital.servicedesk.administrativo.cambios.mapper;

import com.hospital.servicedesk.administrativo.cambios.dominio.ValidadorSolicitudCambio;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;

import java.util.List;
import java.util.stream.IntStream;

public final class SolicitudCambioMapper {

    private SolicitudCambioMapper() {}

    public static CambioResumenRespuesta aResumen(SolicitudCambio s) {
        return new CambioResumenRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante() != null ? s.getSolicitante().getNombreCompleto() : "Sistema",
                s.getResponsableEjecucion(), s.getFechaRegistro()
        );
    }

    public static CambioDetalleRespuesta aDetalle(SolicitudCambio s, List<HistorialSolicitudCambio> historial,
                                                  List<AccionCambio> acciones, List<String> advertencias) {
        List<AreaAfectadaRespuesta> areas = s.getAreasAfectadas().stream()
                .map(a -> new AreaAfectadaRespuesta(a.getIdArea(), a.getNombre(), ValidadorSolicitudCambio.esAreaCritica(a)))
                .toList();

        EvaluacionImpactoRespuesta eval = new EvaluacionImpactoRespuesta(
                s.getImpacto(), areas, s.isRequiereInterrupcion(), s.getMinutosInterrupcion(),
                s.getServiciosAfectados(), s.getPacientesPotencialmenteAfectados(), s.getDescripcionImpacto()
        );

        List<PasoPlanRespuesta> pasosImpl = IntStream.range(0, s.getPasosImplementacion().size())
                .mapToObj(i -> {
                    var p = s.getPasosImplementacion().get(i);
                    return new PasoPlanRespuesta(i + 1, p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados());
                }).toList();

        List<PasoPlanRespuesta> pasosRev = IntStream.range(0, s.getPasosReversa().size())
                .mapToObj(i -> {
                    var p = s.getPasosReversa().get(i);
                    return new PasoPlanRespuesta(i + 1, p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados());
                }).toList();

        PlanReversaRespuesta rev = new PlanReversaRespuesta(
                s.getCriterioReversa(), pasosRev, s.getMinutosReversa(), s.getPlanContinuidad(), s.getResponsableReversa()
        );

        List<EventoCambioRespuesta> hist = historial.stream()
                .map(h -> new EventoCambioRespuesta(
                        h.getFecha(),
                        h.getUsuario() != null ? h.getUsuario().getNombreCompleto() : "Sistema",
                        h.getEstadoAnterior(),
                        h.getEstadoNuevo(),
                        h.getObservacion()
                )).toList();

        return new CambioDetalleRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante() != null ? s.getSolicitante().getNombreCompleto() : "Sistema",
                s.getResponsableEjecucion(), s.getFechaRegistro(), s.getDescripcion(), s.getJustificacion(),
                s.getEquiposAfectados(), s.getTicketOrigen() != null ? s.getTicketOrigen().getIdTicket() : null,
                eval, pasosImpl, rev,
                s.getAprobador() != null ? s.getAprobador().getNombreCompleto() : null,
                s.getFechaDecision(), s.getObservacionDecision(), s.getResultadoImplementacion(),
                s.getFechaInicioReal(), s.getFechaFinReal(), hist, acciones, advertencias, s.getVersion()
        );
    }

    private static List<String> nombresAreas(SolicitudCambio s) {
        return s.getAreasAfectadas().stream().map(Area::getNombre).toList();
    }

    private static HorarioProgramado horario(SolicitudCambio s) {
        return s.getHorarioInicio() == null ? null : new HorarioProgramado(s.getHorarioInicio(), s.getHorarioFin());
    }
}
""")

# 5. Service Implementation
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/aplicacion/impl/SolicitudCambioServiceImpl.java", """package com.hospital.servicedesk.administrativo.cambios.aplicacion.impl;

import com.hospital.servicedesk.administrativo.cambios.aplicacion.SolicitudCambioService;
import com.hospital.servicedesk.administrativo.cambios.dominio.*;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.administrativo.cambios.eventos.SolicitudCambioTransicionadaEvento;
import com.hospital.servicedesk.administrativo.cambios.mapper.SolicitudCambioMapper;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.compartido.correlativo.GeneradorCorrelativo;
import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SolicitudCambioServiceImpl implements SolicitudCambioService {

    private static final String PREFIJO_CODIGO = "SC";

    private final SolicitudCambioRepository repository;
    private final HistorialSolicitudCambioRepository historialRepository;
    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TicketRepository ticketRepository;
    private final GeneradorCorrelativo generadorCorrelativo;
    private final CalculadoraRiesgo calculadoraRiesgo;
    private final MaquinaEstadosCambio maquinaEstados;
    private final ValidadorSolicitudCambio validador;
    private final PoliticaAccesoCambios politica;
    private final ApplicationEventPublisher eventos;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<CambioResumenRespuesta> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto) {
        String textoNorm = texto != null && !texto.isBlank() ? NormalizadorBusqueda.normalizar(texto) : null;
        return repository.buscar(estado, impacto, tipo, textoNorm).stream()
                .map(SolicitudCambioMapper::aResumen)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CambioDetalleRespuesta obtener(Integer id) {
        SolicitudCambio s = repository.findDetalleById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud de cambio no encontrada: " + id));
        List<HistorialSolicitudCambio> hist = historialRepository.findBySolicitud_IdOrderByFechaAscIdAsc(id);
        List<AccionCambio> acciones = maquinaEstados.accionesPermitidas(s.getEstado(), new ContextoActor("sistema", "ADMINISTRADOR", "127.0.0.1"));
        return SolicitudCambioMapper.aDetalle(s, hist, acciones, List.of());
    }

    @Override
    @Transactional
    public CambioDetalleRespuesta crear(SolicitudCambioFormulario formulario, ContextoActor ctx) {
        validador.validar(formulario);
        LocalDateTime ahora = LocalDateTime.now(clock);

        Usuario solicitante = usuarioRepository.findByCorreo(ctx.correo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario actor no encontrado: " + ctx.correo()));

        Set<Area> areas = new LinkedHashSet<>(areaRepository.findAllById(formulario.evaluacion().idsAreasAfectadas()));
        if (areas.isEmpty()) {
            throw new ConflictoNegocioException("evaluacion", "Debe seleccionar al menos un área afectada válida.");
        }

        Ticket ticketOrigen = formulario.idTicketOrigen() != null ?
                ticketRepository.findById(formulario.idTicketOrigen())
                        .orElseThrow(() -> new RecursoNoEncontradoException("Ticket origen no encontrado")) : null;

        String codigo = generadorCorrelativo.siguiente(PREFIJO_CODIGO, ahora.getYear());

        NivelRiesgo riesgo = calculadoraRiesgo.calcular(
                formulario.tipo(),
                formulario.evaluacion().nivel(),
                formulario.evaluacion().requiereInterrupcion(),
                areas.size()
        );

        SolicitudCambio s = SolicitudCambio.builder()
                .codigo(codigo)
                .titulo(formulario.titulo().trim())
                .tipo(formulario.tipo())
                .categoria(formulario.categoria())
                .descripcion(formulario.descripcion().trim())
                .justificacion(formulario.justificacion().trim())
                .impacto(formulario.evaluacion().nivel())
                .riesgo(riesgo)
                .requiereInterrupcion(formulario.evaluacion().requiereInterrupcion())
                .minutosInterrupcion(formulario.evaluacion().minutosInterrupcion())
                .pacientesPotencialmenteAfectados(formulario.evaluacion().pacientesAfectados())
                .descripcionImpacto(formulario.evaluacion().descripcionImpacto().trim())
                .areasAfectadas(areas)
                .serviciosAfectados(formulario.serviciosAfectados() != null ? formulario.serviciosAfectados() : new ArrayList<>())
                .equiposAfectados(formulario.equiposAfectados() != null ? formulario.equiposAfectados() : new ArrayList<>())
                .pasosImplementacion(formulario.pasosImplementacion().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList())
                .pasosReversa(formulario.planReversa().pasos().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList())
                .criterioReversa(formulario.planReversa().criterioActivacion().trim())
                .minutosReversa(formulario.planReversa().minutosEstimados())
                .planContinuidad(formulario.planReversa().planContinuidad())
                .responsableReversa(formulario.planReversa().responsableReversa().trim())
                .responsableEjecucion(formulario.responsableEjecucion())
                .horarioInicio(formulario.horario() != null ? formulario.horario().inicioIso() : null)
                .horarioFin(formulario.horario() != null ? formulario.horario().finIso() : null)
                .ticketOrigen(ticketOrigen)
                .solicitante(solicitante)
                .estado(EstadoCambio.BORRADOR)
                .textoBusqueda(NormalizadorBusqueda.componer(codigo, formulario.titulo(), areas.stream().map(Area::getNombre).reduce("", (a, b) -> a + " " + b)))
                .fechaRegistro(ahora)
                .fechaActualizacion(ahora)
                .build();

        repository.save(s);
        registrarHistorial(s, solicitante, "CREAR", null, EstadoCambio.BORRADOR, "Creación de solicitud de cambio", ctx, ahora);
        log.info("Solicitud de cambio {} creada por {}", codigo, ctx.correo());
        return obtener(s.getId());
    }

    @Override
    @Transactional
    public CambioDetalleRespuesta actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        exigirEditable(s);
        Usuario actor = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);
        politica.verificarEdicion(s, actor, ctx);
        validador.validar(formulario);

        LocalDateTime ahora = LocalDateTime.now(clock);
        Set<Area> areas = new LinkedHashSet<>(areaRepository.findAllById(formulario.evaluacion().idsAreasAfectadas()));

        s.setTitulo(formulario.titulo().trim());
        s.setTipo(formulario.tipo());
        s.setCategoria(formulario.categoria());
        s.setDescripcion(formulario.descripcion().trim());
        s.setJustificacion(formulario.justificacion().trim());
        s.setImpacto(formulario.evaluacion().nivel());
        s.setRequiereInterrupcion(formulario.evaluacion().requiereInterrupcion());
        s.setMinutosInterrupcion(formulario.evaluacion().minutosInterrupcion());
        s.setPacientesPotencialmenteAfectados(formulario.evaluacion().pacientesAfectados());
        s.setDescripcionImpacto(formulario.evaluacion().descripcionImpacto().trim());
        s.setAreasAfectadas(areas);
        s.setServiciosAfectados(formulario.serviciosAfectados() != null ? formulario.serviciosAfectados() : new ArrayList<>());
        s.setEquiposAfectados(formulario.equiposAfectados() != null ? formulario.equiposAfectados() : new ArrayList<>());
        s.setPasosImplementacion(formulario.pasosImplementacion().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList());
        s.setPasosReversa(formulario.planReversa().pasos().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList());
        s.setCriterioReversa(formulario.planReversa().criterioActivacion().trim());
        s.setMinutosReversa(formulario.planReversa().minutosEstimados());
        s.setPlanContinuidad(formulario.planReversa().planContinuidad());
        s.setResponsableReversa(formulario.planReversa().responsableReversa().trim());
        s.setResponsableEjecucion(formulario.responsableEjecucion());
        s.setHorarioInicio(formulario.horario() != null ? formulario.horario().inicioIso() : null);
        s.setHorarioFin(formulario.horario() != null ? formulario.horario().finIso() : null);
        s.setRiesgo(calculadoraRiesgo.calcular(formulario.tipo(), formulario.evaluacion().nivel(), formulario.evaluacion().requiereInterrupcion(), areas.size()));
        s.setTextoBusqueda(NormalizadorBusqueda.componer(s.getCodigo(), s.getTitulo(), areas.stream().map(Area::getNombre).reduce("", (a, b) -> a + " " + b)));
        s.setFechaActualizacion(ahora);

        repository.save(s);
        registrarHistorial(s, actor, "ACTUALIZAR", s.getEstado(), s.getEstado(), "Actualización de borrador", ctx, ahora);
        log.info("Solicitud de cambio {} actualizada por {}", s.getCodigo(), ctx.correo());
        return obtener(s.getId());
    }

    @Override
    @Transactional
    public CambioDetalleRespuesta transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        AccionCambio accion = transicion.accion();
        EstadoCambio anterior = s.getEstado();

        maquinaEstados.validarTransicion(accion, anterior, transicion.observacion(), ctx);
        Usuario actor = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);
        politica.verificarTransicion(accion, s, actor, ctx);

        LocalDateTime ahora = LocalDateTime.now(clock);
        EstadoCambio nuevo = accion.getDestino();

        s.setEstado(nuevo);
        s.setFechaActualizacion(ahora);

        if (accion == AccionCambio.APROBAR || accion == AccionCambio.RECHAZAR || accion == AccionCambio.DEVOLVER_BORRADOR) {
            s.setAprobador(actor);
            s.setFechaDecision(ahora);
            s.setObservacionDecision(transicion.observacion());
        }

        if (accion == AccionCambio.INICIAR_EJECUCION) {
            s.setFechaInicioReal(ahora);
        }

        if (accion == AccionCambio.MARCAR_IMPLEMENTADO) {
            s.setFechaFinReal(ahora);
        }

        repository.save(s);
        registrarHistorial(s, actor, accion.name(), anterior, nuevo, transicion.observacion(), ctx, ahora);
        eventos.publishEvent(new SolicitudCambioTransicionadaEvento(s.getId(), s.getCodigo(), s.getTitulo(), accion, anterior, nuevo, s.getImpacto(), ctx.correo()));
        log.info("Solicitud {}: {} -> {} por {}", s.getCodigo(), anterior, nuevo, ctx.correo());
        return obtener(s.getId());
    }

    @Override
    @Transactional
    public void eliminar(Integer id, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        exigirEditable(s);
        Usuario actor = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);
        politica.verificarEdicion(s, actor, ctx);
        historialRepository.deleteBySolicitud_Id(id);
        repository.delete(s);
        log.info("Borrador {} eliminado por {}", s.getCodigo(), ctx.correo());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaAfectadaRespuesta> listarAreasSeleccionables() {
        return areaRepository.findAll().stream()
                .map(a -> new AreaAfectadaRespuesta(a.getIdArea(), a.getNombre(), ValidadorSolicitudCambio.esAreaCritica(a)))
                .toList();
    }

    private SolicitudCambio buscar(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud de cambio no encontrada: " + id));
    }

    private void exigirEditable(SolicitudCambio s) {
        if (s.getEstado() != EstadoCambio.BORRADOR) {
            throw new ConflictoNegocioException("Solo se pueden modificar o eliminar solicitudes en estado Borrador.");
        }
    }

    private void registrarHistorial(SolicitudCambio s, Usuario actor, String accion, EstadoCambio anterior, EstadoCambio nuevo, String obs, ContextoActor ctx, LocalDateTime ahora) {
        historialRepository.save(HistorialSolicitudCambio.builder()
                .solicitud(s)
                .usuario(actor)
                .accion(accion)
                .estadoAnterior(anterior)
                .estadoNuevo(nuevo)
                .observacion(obs)
                .ipOrigen(ctx != null ? ctx.ipOrigen() : "127.0.0.1")
                .fecha(ahora)
                .build());
    }
}
""")

# 6. Controller
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/api/SolicitudCambioController.java", """package com.hospital.servicedesk.administrativo.cambios.api;

import com.hospital.servicedesk.administrativo.cambios.aplicacion.SolicitudCambioService;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.entities.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({"/api/solicitudes-cambio", "/api/rfc"})
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
@RequiredArgsConstructor
public class SolicitudCambioController {

    private final SolicitudCambioService service;
    private final ResolutorContextoActor resolutorActor;

    @GetMapping
    public List<CambioResumenRespuesta> listar(@RequestParam(required = false) EstadoCambio estado,
                                               @RequestParam(required = false) ImpactoAsistencial impacto,
                                               @RequestParam(required = false) TipoCambio tipo,
                                               @RequestParam(required = false) String texto) {
        return service.listar(estado, impacto, tipo, texto);
    }

    @GetMapping("/{id}")
    public CambioDetalleRespuesta obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<CambioDetalleRespuesta> crear(@Valid @RequestBody SolicitudCambioFormulario formulario,
                                                        Authentication auth, HttpServletRequest request) {
        CambioDetalleRespuesta creado = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/solicitudes-cambio/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public CambioDetalleRespuesta actualizar(@PathVariable Integer id,
                                               @Valid @RequestBody SolicitudCambioFormulario formulario,
                                               Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/transicionar")
    public CambioDetalleRespuesta transicionar(@PathVariable Integer id,
                                               @Valid @RequestBody TransicionCambioSolicitud transicion,
                                               Authentication auth, HttpServletRequest request) {
        return service.transicionar(id, transicion, resolutorActor.resolver(auth, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.eliminar(id, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/areas-seleccionables")
    public List<AreaAfectadaRespuesta> listarAreasSeleccionables() {
        return service.listarAreasSeleccionables();
    }
}
""")

print("Phase 2 & 3 files updated successfully.")
