package com.hospital.servicedesk.administrativo.cambios.aplicacion.impl;

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
