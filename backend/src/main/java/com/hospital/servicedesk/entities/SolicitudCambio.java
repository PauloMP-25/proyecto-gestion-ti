package com.hospital.servicedesk.entities;

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
