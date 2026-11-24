import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 1A. Enums
write_file("backend/src/main/java/com/hospital/servicedesk/entities/EstadoCambio.java", """package com.hospital.servicedesk.entities;

import lombok.Getter;

@Getter
public enum EstadoCambio {
    BORRADOR("Borrador"),
    EN_EVALUACION("En evaluación"),
    APROBADO("Aprobado"),
    RECHAZADO("Rechazado"),
    EN_EJECUCION("En ejecución"),
    IMPLEMENTADO("Implementado"),
    CANCELADO("Cancelado");

    private final String etiqueta;

    EstadoCambio(String etiqueta) { this.etiqueta = etiqueta; }

    public boolean esTerminal() {
        return this == RECHAZADO || this == IMPLEMENTADO || this == CANCELADO;
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/TipoCambio.java", """package com.hospital.servicedesk.entities;

public enum TipoCambio {
    RUTINARIO, PROGRAMADO, URGENTE
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/CategoriaCambio.java", """package com.hospital.servicedesk.entities;

public enum CategoriaCambio {
    SISTEMA_CLINICO, RED, SERVIDOR, EQUIPO_USUARIO, SEGURIDAD
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/ImpactoAsistencial.java", """package com.hospital.servicedesk.entities;

public enum ImpactoAsistencial {
    BAJO, MEDIO, ALTO, CRITICO;
    public boolean exigeContinuidad() { return this == ALTO || this == CRITICO; }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/NivelRiesgo.java", """package com.hospital.servicedesk.entities;

public enum NivelRiesgo {
    BAJO, MEDIO, ALTO
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/AccionCambio.java", """package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.EnumSet;
import java.util.Set;

import static com.hospital.servicedesk.entities.EstadoCambio.*;

@Getter
public enum AccionCambio {
    ENVIAR_EVALUACION(EnumSet.of(BORRADOR), EN_EVALUACION, false, "enviar a evaluación"),
    APROBAR(EnumSet.of(EN_EVALUACION), APROBADO, false, "aprobar"),
    RECHAZAR(EnumSet.of(EN_EVALUACION), RECHAZADO, true, "rechazar"),
    DEVOLVER_BORRADOR(EnumSet.of(EN_EVALUACION), BORRADOR, true, "devolver a borrador"),
    INICIAR_EJECUCION(EnumSet.of(APROBADO), EN_EJECUCION, false, "iniciar ejecución"),
    MARCAR_IMPLEMENTADO(EnumSet.of(EN_EJECUCION), IMPLEMENTADO, false, "marcar como implementado"),
    CANCELAR(EnumSet.of(BORRADOR, EN_EVALUACION, APROBADO), CANCELADO, true, "cancelar solicitud");

    private final Set<EstadoCambio> origenes;
    private final EstadoCambio destino;
    private final boolean requiereObservacion;
    private final String verbo;

    AccionCambio(Set<EstadoCambio> origenes, EstadoCambio destino, boolean requiereObservacion, String verbo) {
        this.origenes = origenes;
        this.destino = destino;
        this.requiereObservacion = requiereObservacion;
        this.verbo = verbo;
    }

    public boolean permiteDesde(EstadoCambio estado) { return origenes.contains(estado); }
}
""")

# 1B. Entities & Embeddables
write_file("backend/src/main/java/com/hospital/servicedesk/entities/PasoPlanCambio.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasoPlanCambio {

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "responsable", length = 120)
    private String responsable;

    @Column(name = "minutos_estimados")
    private Integer minutosEstimados;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/CorrelativoDocumento.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "correlativo_documento")
public class CorrelativoDocumento {

    @Id
    @Column(name = "clave", length = 30)
    private String clave;

    @Column(name = "ultimo", nullable = false)
    private Integer ultimo;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/SolicitudCambio.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "solicitud_cambio")
public class SolicitudCambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud_cambio")
    private Integer id;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String codigo;

    @Column(name = "titulo", nullable = false, length = 120)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoCambio tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaCambio categoria;

    @Column(name = "descripcion", nullable = false, length = 4000)
    private String descripcion;

    @Column(name = "justificacion", nullable = false, length = 4000)
    private String justificacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "impacto", nullable = false, length = 20)
    private ImpactoAsistencial impacto;

    @Enumerated(EnumType.STRING)
    @Column(name = "riesgo", nullable = false, length = 20)
    private NivelRiesgo riesgo;

    @Column(name = "requiere_interrupcion", nullable = false)
    private boolean requiereInterrupcion;

    @Column(name = "minutos_interrupcion")
    private Integer minutosInterrupcion;

    @Column(name = "pacientes_afectados", length = 500)
    private String pacientesPotencialmenteAfectados;

    @Column(name = "descripcion_impacto", nullable = false, length = 2000)
    private String descripcionImpacto;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "solicitud_cambio_area",
            joinColumns = @JoinColumn(name = "id_solicitud_cambio"),
            inverseJoinColumns = @JoinColumn(name = "id_area"))
    @Builder.Default
    private Set<Area> areasAfectadas = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_servicio", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Column(name = "nombre_servicio", nullable = false, length = 150)
    @Builder.Default
    private List<String> serviciosAfectados = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_equipo", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Column(name = "codigo_inventario", nullable = false, length = 30)
    @Builder.Default
    private List<String> equiposAfectados = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_paso_implementacion", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<PasoPlanCambio> pasosImplementacion = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_paso_reversa", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<PasoPlanCambio> pasosReversa = new ArrayList<>();

    @Column(name = "criterio_reversa", nullable = false, length = 500)
    private String criterioReversa;

    @Column(name = "minutos_reversa", nullable = false)
    private Integer minutosReversa;

    @Column(name = "plan_continuidad", length = 1000)
    private String planContinuidad;

    @Column(name = "responsable_reversa", nullable = false, length = 120)
    private String responsableReversa;

    @Column(name = "responsable_ejecucion", length = 120)
    private String responsableEjecucion;

    @Column(name = "horario_inicio")
    private LocalDateTime horarioInicio;

    @Column(name = "horario_fin")
    private LocalDateTime horarioFin;

    @Column(name = "fecha_inicio_real")
    private LocalDateTime fechaInicioReal;

    @Column(name = "fecha_fin_real")
    private LocalDateTime fechaFinReal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket_origen")
    private Ticket ticketOrigen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitante", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_aprobador")
    private Usuario aprobador;

    @Column(name = "fecha_decision")
    private LocalDateTime fechaDecision;

    @Column(name = "observacion_decision", length = 1000)
    private String observacionDecision;

    @Column(name = "resultado_implementacion", length = 2000)
    private String resultadoImplementacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoCambio estado = EstadoCambio.BORRADOR;

    @Column(name = "texto_busqueda", nullable = false, length = 1000)
    private String textoBusqueda;

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/HistorialSolicitudCambio.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "historial_solicitud_cambio")
public class HistorialSolicitudCambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial_cambio")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitud_cambio", nullable = false)
    private SolicitudCambio solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 30)
    private String accion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoCambio estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", length = 20, nullable = false)
    private EstadoCambio estadoNuevo;

    @Column(name = "observacion", length = 1000)
    private String observacion;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "fecha", nullable = false, updatable = false)
    private LocalDateTime fecha;
}
""")

# 1C. Repositories & Correlativo
write_file("backend/src/main/java/com/hospital/servicedesk/repositories/CorrelativoDocumentoRepository.java", """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.CorrelativoDocumento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CorrelativoDocumentoRepository extends JpaRepository<CorrelativoDocumento, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CorrelativoDocumento c where c.clave = :clave")
    Optional<CorrelativoDocumento> bloquear(@Param("clave") String clave);
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/correlativo/GeneradorCorrelativo.java", """package com.hospital.servicedesk.compartido.correlativo;

import com.hospital.servicedesk.entities.CorrelativoDocumento;
import com.hospital.servicedesk.repositories.CorrelativoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class GeneradorCorrelativo {

    private final CorrelativoDocumentoRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public String siguiente(String prefijo, int anio) {
        String clave = prefijo + "-" + anio;
        CorrelativoDocumento contador = repository.bloquear(clave)
                .orElseGet(() -> repository.saveAndFlush(new CorrelativoDocumento(clave, 0)));
        contador.setUltimo(contador.getUltimo() + 1);
        return "%s-%d-%04d".formatted(prefijo, anio, contador.getUltimo());
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/repositories/SolicitudCambioRepository.java", """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SolicitudCambioRepository extends JpaRepository<SolicitudCambio, Integer> {

    @Query(\"""
            select s from SolicitudCambio s
            where (:estado is null or s.estado = :estado)
              and (:impacto is null or s.impacto = :impacto)
              and (:tipo is null or s.tipo = :tipo)
              and (:texto is null or s.textoBusqueda like concat('%', :texto, '%'))
            order by s.fechaRegistro desc
            \"\"\")
    @EntityGraph(attributePaths = {"solicitante", "areasAfectadas"})
    List<SolicitudCambio> buscar(@Param("estado") EstadoCambio estado,
                                 @Param("impacto") ImpactoAsistencial impacto,
                                 @Param("tipo") TipoCambio tipo,
                                 @Param("texto") String textoNormalizado);

    @EntityGraph(attributePaths = {"solicitante", "aprobador", "areasAfectadas", "ticketOrigen", "pasosImplementacion", "pasosReversa"})
    Optional<SolicitudCambio> findDetalleById(Integer id);
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/repositories/HistorialSolicitudCambioRepository.java", """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.HistorialSolicitudCambio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialSolicitudCambioRepository extends JpaRepository<HistorialSolicitudCambio, Integer> {

    @EntityGraph(attributePaths = "usuario")
    List<HistorialSolicitudCambio> findBySolicitud_IdOrderByFechaAscIdAsc(Integer idSolicitud);

    void deleteBySolicitud_Id(Integer idSolicitud);
}
""")

# 1D. DTOs
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

    public record SolicitudCambioFormulario(
            @NotBlank(message = "El título es obligatorio.")
            @Size(max = 120, message = "Máximo 120 caracteres.") String titulo,
            @NotNull(message = "Seleccione el tipo de cambio.") TipoCambio tipo,
            @NotNull(message = "Seleccione la categoría.") CategoriaCambio categoria,
            @NotBlank(message = "La descripción técnica es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String descripcion,
            @NotBlank(message = "La justificación de negocio es obligatoria.")
            @Size(max = 4000, message = "Máximo 4000 caracteres.") String justificacion,
            @NotNull @Valid EvaluacionImpactoFormulario impacto,
            List<@NotBlank @Size(max = 150) String> serviciosAfectados,
            List<@NotBlank @Size(max = 30) String> equiposAfectados,
            @NotEmpty(message = "El plan de implementación debe tener al menos un paso.")
            List<@NotNull @Valid PasoPlanFormulario> pasosImplementacion,
            @NotEmpty(message = "El plan de reversa debe tener al menos un paso.")
            List<@NotNull @Valid PasoPlanFormulario> pasosReversa,
            @NotBlank(message = "El criterio de reversa es obligatorio.")
            @Size(max = 500) String criterioReversa,
            @NotNull @Positive(message = "Indique los minutos estimados para la reversa.") Integer minutosReversa,
            @Size(max = 1000) String planContinuidad,
            @NotBlank(message = "Indique el responsable de reversa.")
            @Size(max = 120) String responsableReversa,
            @Size(max = 120) String responsableEjecucion,
            @Valid HorarioProgramado horarioProgramado,
            Integer idTicketOrigen) {}

    public record TransicionCambioSolicitud(
            @NotNull(message = "Seleccione la acción a realizar.") AccionCambio accion,
            @Size(max = 1000, message = "La observación no puede superar los 1000 caracteres.") String observacion) {}

    public record ResultadoImplementacionFormulario(
            @NotBlank(message = "Describa el resultado de la implementación.")
            @Size(max = 2000) String resultado) {}

    public record PasoDetalle(
            String descripcion,
            String responsable,
            Integer minutosEstimados) {}

    public record HistorialCambioItem(
            Integer id,
            String usuarioCorreo,
            String usuarioNombre,
            String accion,
            EstadoCambio estadoAnterior,
            EstadoCambio estadoNew,
            String observacion,
            LocalDateTime fecha) {}

    public record CambioResumen(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            EstadoCambio estado,
            String solicitanteNombre,
            List<String> areasAfectadasNombres,
            LocalDateTime fechaRegistro) {}

    public record CambioDetalle(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            String descripcion,
            String justificacion,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            boolean requiereInterrupcion,
            Integer minutosInterrupcion,
            String pacientesPotencialmenteAfectados,
            String descripcionImpacto,
            List<String> areasAfectadasNombres,
            List<String> serviciosAfectados,
            List<String> equiposAfectados,
            List<PasoDetalle> pasosImplementacion,
            List<PasoDetalle> pasosReversa,
            String criterioReversa,
            Integer minutosReversa,
            String planContinuidad,
            String responsableReversa,
            String responsableEjecucion,
            LocalDateTime horarioInicio,
            LocalDateTime horarioFin,
            LocalDateTime fechaInicioReal,
            LocalDateTime fechaFinReal,
            Integer idTicketOrigen,
            String codigoTicketOrigen,
            String solicitanteNombre,
            String aprobadorNombre,
            LocalDateTime fechaDecision,
            String observacionDecision,
            String resultadoImplementacion,
            EstadoCambio estado,
            List<AccionCambio> accionesPermitidas,
            List<HistorialCambioItem> historial,
            LocalDateTime fechaRegistro,
            LocalDateTime fechaActualizacion,
            Long version) {}
}
""")

# 1E. Domain logic
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dominio/CalculadoraRiesgo.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.entities.ImpactoAsistencial;
import com.hospital.servicedesk.entities.NivelRiesgo;
import com.hospital.servicedesk.entities.TipoCambio;
import org.springframework.stereotype.Component;

@Component
public class CalculadoraRiesgo {

    public NivelRiesgo calcular(TipoCambio tipo, ImpactoAsistencial impacto, boolean requiereInterrupcion, int numAreas) {
        if (tipo == TipoCambio.URGENTE || impacto == ImpactoAsistencial.CRITICO || (requiereInterrupcion && numAreas >= 3)) {
            return NivelRiesgo.ALTO;
        }
        if (tipo == TipoCambio.PROGRAMADO || impacto == ImpactoAsistencial.ALTO || (requiereInterrupcion && numAreas >= 2)) {
            return NivelRiesgo.MEDIO;
        }
        return NivelRiesgo.BAJO;
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dominio/MaquinaEstadosCambio.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class MaquinaEstadosCambio {

    public List<AccionCambio> accionesPermitidas(EstadoCambio estadoActual, ContextoActor ctx) {
        return Arrays.stream(AccionCambio.values())
                .filter(a -> a.permiteDesde(estadoActual))
                .filter(a -> puedeEjecutar(a, ctx))
                .toList();
    }

    public void validarTransicion(AccionCambio accion, EstadoCambio estadoActual, String observacion, ContextoActor ctx) {
        if (!accion.permiteDesde(estadoActual)) {
            throw new ConflictoNegocioException("La acción '" + accion.getVerbo() + "' no está permitida para el estado actual (" + estadoActual.getEtiqueta() + ").");
        }
        if (!puedeEjecutar(accion, ctx)) {
            throw new ConflictoNegocioException("No tiene permisos para ejecutar la acción '" + accion.getVerbo() + "'.");
        }
        if (accion.isRequiereObservacion() && (observacion == null || observacion.isBlank())) {
            throw new ConflictoNegocioException("observacion", "La acción '" + accion.getVerbo() + "' requiere una observación o motivo obligatorio.");
        }
    }

    private boolean puedeEjecutar(AccionCambio accion, ContextoActor ctx) {
        return switch (accion) {
            case ENVIAR_EVALUACION, CANCELAR -> ctx.esAdministrador() || ctx.esTecnico() || ctx.esPracticante();
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> ctx.esAdministrador();
            case INICIAR_EJECUCION, MARCAR_IMPLEMENTADO -> ctx.esPersonalTecnico();
        };
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dominio/ValidadorSolicitudCambio.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.SolicitudCambioFormulario;
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

    public void validar(SolicitudCambioFormulario f) {
        LocalDateTime ahora = LocalDateTime.now(clock);

        if (f.horarioProgramado() != null) {
            if (f.horarioProgramado().inicioIso().isBefore(ahora)) {
                throw new ReglaNegocioException("horarioProgramado", "La fecha de inicio programada no puede estar en el pasado.");
            }
            if (f.horarioProgramado().finIso().isBefore(f.horarioProgramado().inicioIso())) {
                throw new ReglaNegocioException("horarioProgramado", "La fecha de fin programada debe ser posterior al inicio.");
            }
        }

        if (f.impacto().nivel().exigeContinuidad() && (f.planContinuidad() == null || f.planContinuidad().isBlank())) {
            throw new ReglaNegocioException("planContinuidad", "Los cambios con impacto alto o crítico exigen un plan de continuidad asistencial.");
        }
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/cambios/dominio/PoliticaAccesoCambios.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.SolicitudCambio;
import com.hospital.servicedesk.entities.Usuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class PoliticaAccesoCambios {

    public void verificarEdicion(SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        exigir(ctx.esAdministrador() || esSolicitante(s, actor),
                "Solo quien registró la solicitud puede modificarla.");
    }

    public void verificarTransicion(AccionCambio accion, SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        boolean solicitante = esSolicitante(s, actor);
        switch (accion) {
            case ENVIAR_EVALUACION, CANCELAR ->
                    exigir(ctx.esAdministrador() || solicitante, "Solo quien registró la solicitud puede hacerlo.");
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> {
                exigir(ctx.esAdministrador(), "Solo el comité de evaluación puede decidir sobre una solicitud.");
                exigir(!solicitante, "Quien registró la solicitud no puede evaluarla.");
            }
            case INICIAR_EJECUCION, MARCAR_IMPLEMENTADO ->
                    exigir(ctx.esPersonalTecnico(), "Solo el personal técnico puede ejecutar cambios.");
        }
    }

    private static boolean esSolicitante(SolicitudCambio s, Usuario actor) {
        return s.getSolicitante().getIdUsuario().equals(actor.getIdUsuario());
    }

    private static void exigir(boolean condicion, String mensaje) {
        if (!condicion) throw new AccessDeniedException(mensaje);
    }
}
""")

print("Phase 1 files generated successfully.")
