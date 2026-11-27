import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# Event
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/eventos/SolicitudCambioTransicionadaEvento.java", """package com.hospital.servicedesk.administrativo.cambios.eventos;

import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.entities.ImpactoAsistencial;

public record SolicitudCambioTransicionadaEvento(
        Integer idSolicitud, String codigo, String titulo, AccionCambio accion,
        EstadoCambio estadoAnterior, EstadoCambio estadoNuevo, ImpactoAsistencial impacto, String correoActor) {}
""")

# Service Interface
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/aplicacion/SolicitudCambioService.java", """package com.hospital.servicedesk.administrativo.cambios.aplicacion;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;

import java.util.List;

public interface SolicitudCambioService {
    List<CambioResumen> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto);
    CambioDetalle obtener(Integer id);
    CambioDetalle crear(SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalle actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalle transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx);
    void eliminar(Integer id, ContextoActor ctx);
    List<AreaResumen> listarAreasSeleccionables();
}
""")

# Mapper
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/mapper/SolicitudCambioMapper.java", """package com.hospital.servicedesk.administrativo.cambios.mapper;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;

import java.util.List;
import java.util.stream.Collectors;

public final class SolicitudCambioMapper {

    private SolicitudCambioMapper() {}

    public static CambioResumen aResumen(SolicitudCambio s) {
        return new CambioResumen(
                s.getId(),
                s.getCodigo(),
                s.getTitulo(),
                s.getTipo(),
                s.getCategoria(),
                s.getImpacto(),
                s.getRiesgo(),
                s.getEstado(),
                s.getSolicitante() != null ? s.getSolicitante().getNombreCompleto() : "Sistema",
                s.getAreasAfectadas().stream().map(Area::getNombre).toList(),
                s.getFechaRegistro()
        );
    }

    public static CambioDetalle aDetalle(SolicitudCambio s, List<HistorialSolicitudCambio> historial, List<AccionCambio> accionesPermitidas) {
        return new CambioDetalle(
                s.getId(),
                s.getCodigo(),
                s.getTitulo(),
                s.getTipo(),
                s.getCategoria(),
                s.getDescripcion(),
                s.getJustificacion(),
                s.getImpacto(),
                s.getRiesgo(),
                s.isRequiereInterrupcion(),
                s.getMinutosInterrupcion(),
                s.getPacientesPotencialmenteAfectados(),
                s.getDescripcionImpacto(),
                s.getAreasAfectadas().stream().map(Area::getNombre).toList(),
                s.getServiciosAfectados(),
                s.getEquiposAfectados(),
                s.getPasosImplementacion().stream().map(p -> new PasoDetalle(p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados())).toList(),
                s.getPasosReversa().stream().map(p -> new PasoDetalle(p.getDescripcion(), p.getResponsable(), p.getMinutosEstimados())).toList(),
                s.getCriterioReversa(),
                s.getMinutosReversa(),
                s.getPlanContinuidad(),
                s.getResponsableReversa(),
                s.getResponsableEjecucion(),
                s.getHorarioInicio(),
                s.getHorarioFin(),
                s.getFechaInicioReal(),
                s.getFechaFinReal(),
                s.getTicketOrigen() != null ? s.getTicketOrigen().getIdTicket() : null,
                s.getTicketOrigen() != null ? s.getTicketOrigen().getAsunto() : null,
                s.getSolicitante() != null ? s.getSolicitante().getNombreCompleto() : "Sistema",
                s.getAprobador() != null ? s.getAprobador().getNombreCompleto() : null,
                s.getFechaDecision(),
                s.getObservacionDecision(),
                s.getResultadoImplementacion(),
                s.getEstado(),
                accionesPermitidas,
                historial.stream().map(h -> new HistorialCambioItem(
                        h.getId(),
                        h.getUsuario() != null ? h.getUsuario().getCorreo() : "sistema",
                        h.getUsuario() != null ? h.getUsuario().getNombreCompleto() : "Sistema",
                        h.getAccion(),
                        h.getEstadoAnterior(),
                        h.getEstadoNuevo(),
                        h.getObservacion(),
                        h.getFecha()
                )).toList(),
                s.getFechaRegistro(),
                s.getFechaActualizacion(),
                s.getVersion()
        );
    }
}
""")

# Service Implementation
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
    public List<CambioResumen> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto) {
        String textoNorm = texto != null && !texto.isBlank() ? NormalizadorBusqueda.normalizar(texto) : null;
        return repository.buscar(estado, impacto, tipo, textoNorm).stream()
                .map(SolicitudCambioMapper::aResumen)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CambioDetalle obtener(Integer id) {
        SolicitudCambio s = repository.findDetalleById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud de cambio no encontrada: " + id));
        List<HistorialSolicitudCambio> hist = historialRepository.findBySolicitud_IdOrderByFechaAscIdAsc(id);
        List<AccionCambio> acciones = maquinaEstados.accionesPermitidas(s.getEstado(), new ContextoActor("sistema", "ADMINISTRADOR", "127.0.0.1"));
        return SolicitudCambioMapper.aDetalle(s, hist, acciones);
    }

    @Override
    @Transactional
    public CambioDetalle crear(SolicitudCambioFormulario formulario, ContextoActor ctx) {
        validador.validar(formulario);
        LocalDateTime ahora = LocalDateTime.now(clock);

        Usuario solicitante = usuarioRepository.findByCorreo(ctx.correo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario actor no encontrado: " + ctx.correo()));

        Set<Area> areas = new LinkedHashSet<>(areaRepository.findAllById(formulario.impacto().idsAreasAfectadas()));
        if (areas.isEmpty()) {
            throw new ConflictoNegocioException("impacto", "Debe seleccionar al menos un área afectada válida.");
        }

        Ticket ticketOrigen = formulario.idTicketOrigen() != null ?
                ticketRepository.findById(formulario.idTicketOrigen())
                        .orElseThrow(() -> new RecursoNoEncontradoException("Ticket origen no encontrado")) : null;

        String codigo = generadorCorrelativo.siguiente(PREFIJO_CODIGO, ahora.getYear());

        NivelRiesgo riesgo = calculadoraRiesgo.calcular(
                formulario.tipo(),
                formulario.impacto().nivel(),
                formulario.impacto().requiereInterrupcion(),
                areas.size()
        );

        SolicitudCambio s = SolicitudCambio.builder()
                .codigo(codigo)
                .titulo(formulario.titulo().trim())
                .tipo(formulario.tipo())
                .categoria(formulario.categoria())
                .descripcion(formulario.descripcion().trim())
                .justificacion(formulario.justificacion().trim())
                .impacto(formulario.impacto().nivel())
                .riesgo(riesgo)
                .requiereInterrupcion(formulario.impacto().requiereInterrupcion())
                .minutosInterrupcion(formulario.impacto().minutosInterrupcion())
                .pacientesPotencialmenteAfectados(formulario.impacto().pacientesAfectados())
                .descripcionImpacto(formulario.impacto().descripcionImpacto().trim())
                .areasAfectadas(areas)
                .serviciosAfectados(formulario.serviciosAfectados() != null ? formulario.serviciosAfectados() : new ArrayList<>())
                .equiposAfectados(formulario.equiposAfectados() != null ? formulario.equiposAfectados() : new ArrayList<>())
                .pasosImplementacion(formulario.pasosImplementacion().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList())
                .pasosReversa(formulario.pasosReversa().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList())
                .criterioReversa(formulario.criterioReversa().trim())
                .minutosReversa(formulario.minutosReversa())
                .planContinuidad(formulario.planContinuidad())
                .responsableReversa(formulario.responsableReversa().trim())
                .responsableEjecucion(formulario.responsableEjecucion())
                .horarioInicio(formulario.horarioProgramado() != null ? formulario.horarioProgramado().inicioIso() : null)
                .horarioFin(formulario.horarioProgramado() != null ? formulario.horarioProgramado().finIso() : null)
                .ticketOrigen(ticketOrigen)
                .solicitante(solicitante)
                .estado(EstadoCambio.BORRADOR)
                .textoBusqueda(NormalizadorBusqueda.componer(codigo, formulario.titulo(), areas.stream().map(Area::getNombre).reduce("", (a, b) => a + " " + b)))
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
    public CambioDetalle actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        exigirEditable(s);
        Usuario actor = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);
        politica.verificarEdicion(s, actor, ctx);
        validador.validar(formulario);

        LocalDateTime ahora = LocalDateTime.now(clock);
        Set<Area> areas = new LinkedHashSet<>(areaRepository.findAllById(formulario.impacto().idsAreasAfectadas()));

        s.setTitulo(formulario.titulo().trim());
        s.setTipo(formulario.tipo());
        s.setCategoria(formulario.categoria());
        s.setDescripcion(formulario.descripcion().trim());
        s.setJustificacion(formulario.justificacion().trim());
        s.setImpacto(formulario.impacto().nivel());
        s.setRequiereInterrupcion(formulario.impacto().requiereInterrupcion());
        s.setMinutosInterrupcion(formulario.impacto().minutosInterrupcion());
        s.setPacientesPotencialmenteAfectados(formulario.impacto().pacientesAfectados());
        s.setDescripcionImpacto(formulario.impacto().descripcionImpacto().trim());
        s.setAreasAfectadas(areas);
        s.setServiciosAfectados(formulario.serviciosAfectados() != null ? formulario.serviciosAfectados() : new ArrayList<>());
        s.setEquiposAfectados(formulario.equiposAfectados() != null ? formulario.equiposAfectados() : new ArrayList<>());
        s.setPasosImplementacion(formulario.pasosImplementacion().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList());
        s.setPasosReversa(formulario.pasosReversa().stream().map(p -> new PasoPlanCambio(p.descripcion(), p.responsable(), p.minutosEstimados())).toList());
        s.setCriterioReversa(formulario.criterioReversa().trim());
        s.setMinutosReversa(formulario.minutosReversa());
        s.setPlanContinuidad(formulario.planContinuidad());
        s.setResponsableReversa(formulario.responsableReversa().trim());
        s.setResponsableEjecucion(formulario.responsableEjecucion());
        s.setHorarioInicio(formulario.horarioProgramado() != null ? formulario.horarioProgramado().inicioIso() : null);
        s.setHorarioFin(formulario.horarioProgramado() != null ? formulario.horarioProgramado().finIso() : null);
        s.setRiesgo(calculadoraRiesgo.calcular(formulario.tipo(), formulario.impacto().nivel(), formulario.impacto().requiereInterrupcion(), areas.size()));
        s.setTextoBusqueda(NormalizadorBusqueda.componer(s.getCodigo(), s.getTitulo(), areas.stream().map(Area::getNombre).reduce("", (a, b) => a + " " + b)));
        s.setFechaActualizacion(ahora);

        repository.save(s);
        registrarHistorial(s, actor, "ACTUALIZAR", s.getEstado(), s.getEstado(), "Actualización de borrador", ctx, ahora);
        log.info("Solicitud de cambio {} actualizada por {}", s.getCodigo(), ctx.correo());
        return obtener(s.getId());
    }

    @Override
    @Transactional
    public CambioDetalle transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx) {
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
    public List<AreaResumen> listarAreasSeleccionables() {
        return areaRepository.findAll().stream()
                .map(a -> new AreaResumen(a.getIdArea(), a.getNombre(), a.getTipoArea() != null ? a.getTipoArea().name() : null))
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

# Controller
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
    public List<CambioResumen> listar(@RequestParam(required = false) EstadoCambio estado,
                                      @RequestParam(required = false) ImpactoAsistencial impacto,
                                      @RequestParam(required = false) TipoCambio tipo,
                                      @RequestParam(required = false) String texto) {
        return service.listar(estado, impacto, tipo, texto);
    }

    @GetMapping("/{id}")
    public CambioDetalle obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<CambioDetalle> crear(@Valid @RequestBody SolicitudCambioFormulario formulario,
                                               Authentication auth, HttpServletRequest request) {
        CambioDetalle creado = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/solicitudes-cambio/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public CambioDetalle actualizar(@PathVariable Integer id,
                                      @Valid @RequestBody SolicitudCambioFormulario formulario,
                                      Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/transicionar")
    public CambioDetalle transicionar(@PathVariable Integer id,
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
    public List<AreaResumen> listarAreasSeleccionables() {
        return service.listarAreasSeleccionables();
    }
}
""")

# SQL Migration V1_3
write_file("backend/src/main/resources/db/migraciones/V1_3__solicitudes_cambio.sql", """-- =============================================================================
-- Migración V1_3: Módulo 1 — Solicitudes de Cambio Técnico y Correlativo
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Correlativo ---------------------------------------------------------------
IF OBJECT_ID('dbo.correlativo_documento', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.correlativo_documento (
        clave  VARCHAR(30) NOT NULL CONSTRAINT PK_correlativo_documento PRIMARY KEY,
        ultimo INT         NOT NULL
    );
    -- Semilla inicial para el año actual
    INSERT INTO dbo.correlativo_documento (clave, ultimo) VALUES ('SC-2026', 0);
END;

-- 2. Solicitud de Cambio -------------------------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.solicitud_cambio (
        id_solicitud_cambio   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_solicitud_cambio PRIMARY KEY,
        codigo                VARCHAR(20)       NOT NULL CONSTRAINT UQ_solicitud_cambio_codigo UNIQUE,
        titulo                NVARCHAR(120)     NOT NULL,
        tipo                  VARCHAR(20)       NOT NULL,
        categoria             VARCHAR(30)       NOT NULL,
        descripcion           NVARCHAR(MAX)     NOT NULL,
        justificacion         NVARCHAR(MAX)     NOT NULL,
        impacto               VARCHAR(20)       NOT NULL,
        riesgo                VARCHAR(20)       NOT NULL,
        requiere_interrupcion BIT               NOT NULL,
        minutos_interrupcion  INT               NULL,
        pacientes_afectados   NVARCHAR(500)     NULL,
        descripcion_impacto   NVARCHAR(2000)    NOT NULL,
        criterio_reversa      NVARCHAR(500)     NOT NULL,
        minutos_reversa       INT               NOT NULL,
        plan_continuidad      NVARCHAR(1000)    NULL,
        responsable_reversa   NVARCHAR(120)     NOT NULL,
        responsable_ejecucion NVARCHAR(120)     NULL,
        horario_inicio        DATETIME2(0)      NULL,
        horario_fin           DATETIME2(0)      NULL,
        fecha_inicio_real     DATETIME2(0)      NULL,
        fecha_fin_real        DATETIME2(0)      NULL,
        id_ticket_origen      INT               NULL,
        id_solicitante        INT               NOT NULL,
        id_aprobador          INT               NULL,
        fecha_decision        DATETIME2(0)      NULL,
        observacion_decision  NVARCHAR(1000)    NULL,
        resultado_implementacion NVARCHAR(2000) NULL,
        estado                VARCHAR(20)       NOT NULL,
        texto_busqueda        NVARCHAR(1000)    NOT NULL,
        fecha_registro        DATETIME2(0)      NOT NULL,
        fecha_actualizacion   DATETIME2(0)      NOT NULL,
        version               BIGINT            NOT NULL CONSTRAINT DF_sc_version DEFAULT (0),
        CONSTRAINT FK_sc_ticket_origen FOREIGN KEY (id_ticket_origen) REFERENCES dbo.ticket(id_ticket),
        CONSTRAINT FK_sc_solicitante FOREIGN KEY (id_solicitante) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT FK_sc_aprobador FOREIGN KEY (id_aprobador) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_sc_estado_fecha ON dbo.solicitud_cambio (estado, fecha_registro DESC);
END;

-- 3. Tablas relacionales y colecciones ----------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio_area', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_area (
        id_solicitud_cambio INT NOT NULL,
        id_area             INT NOT NULL,
        CONSTRAINT PK_solicitud_cambio_area PRIMARY KEY (id_solicitud_cambio, id_area),
        CONSTRAINT FK_sca_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_sca_area FOREIGN KEY (id_area) REFERENCES dbo.area(id_area)
    );

IF OBJECT_ID('dbo.solicitud_cambio_servicio', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_servicio (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        nombre_servicio     NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_servicio PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scs_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_equipo', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_equipo (
        id_solicitud_cambio INT         NOT NULL,
        orden               INT         NOT NULL,
        codigo_inventario   VARCHAR(30) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_equipo PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_sce_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_implementacion', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_implementacion (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_impl PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpi_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_reversa', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_reversa (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_rev PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpr_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

-- 4. Historial -----------------------------------------------------------------
IF OBJECT_ID('dbo.historial_solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historial_solicitud_cambio (
        id_historial_cambio INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_historial_solicitud_cambio PRIMARY KEY,
        id_solicitud_cambio INT            NOT NULL,
        id_usuario          INT            NOT NULL,
        accion              VARCHAR(30)    NOT NULL,
        estado_anterior     VARCHAR(20)    NULL,
        estado_nuevo        VARCHAR(20)    NOT NULL,
        observacion         NVARCHAR(1000) NULL,
        ip_origen           VARCHAR(45)    NULL,
        fecha               DATETIME2(0)   NOT NULL,
        CONSTRAINT FK_hsc_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_hsc_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_hsc_solicitud ON dbo.historial_solicitud_cambio (id_solicitud_cambio, fecha);
END;

COMMIT TRANSACTION;
""")

print("Phase 2 & 3 deployed successfully.")
