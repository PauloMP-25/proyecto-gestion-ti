package com.hospital.servicedesk.entities;

import com.hospital.servicedesk.compartido.persistencia.ListaCsvConverter;
import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "error_conocido")
public class ErrorConocido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_error")
    private Integer idError;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descripcion_problema", nullable = false, columnDefinition = "TEXT")
    private String descripcionProblema;

    @Column(name = "solucion_trabajo", nullable = false, columnDefinition = "TEXT")
    private String solucionTrabajo;

    @Builder.Default
    @Column(name = "publicado", nullable = false)
    private Boolean publicado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaGuia categoria = CategoriaGuia.SOFTWARE_ASISTENCIAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "ambito", nullable = false, length = 30)
    private AmbitoGuia ambito = AmbitoGuia.PUBLICO_ASISTENCIAL;

    @Column(name = "sintoma", length = 500)
    private String sintoma;

    @Column(name = "causa_raiz", length = 1000)
    private String causaRaiz;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "nivel_dificultad", nullable = false, length = 20)
    private NivelDificultad nivelDificultad = NivelDificultad.BASICO;

    @Column(name = "minutos_estimados")
    private Integer minutosEstimados;

    @Builder.Default
    @Column(name = "requiere_tecnico", nullable = false)
    private boolean requiereTecnico = false;

    @Convert(converter = ListaCsvConverter.class)
    @Column(name = "palabras_clave", length = 500)
    @Builder.Default
    private List<String> palabrasClave = new ArrayList<>();

    @Convert(converter = ListaCsvConverter.class)
    @Column(name = "equipos_compatibles", length = 500)
    @Builder.Default
    private List<String> equiposCompatibles = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "guia_precaucion", joinColumns = @JoinColumn(name = "id_error"))
    @OrderColumn(name = "orden")
    @Column(name = "precaucion", nullable = false, length = 300)
    @Builder.Default
    private List<String> precauciones = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "guia_paso", joinColumns = @JoinColumn(name = "id_error"))
    @OrderColumn(name = "orden")
    @BatchSize(size = 20)
    @Builder.Default
    private List<PasoSolucion> pasos = new ArrayList<>();

    @Builder.Default
    @Column(name = "conteo_util", nullable = false)
    private int conteoUtil = 0;

    @Builder.Default
    @Column(name = "conteo_no_util", nullable = false)
    private int conteoNoUtil = 0;

    @Builder.Default
    @Column(name = "conteo_visitas", nullable = false)
    private int conteoVisitas = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_autor")
    private Usuario autor;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Column(name = "texto_busqueda", nullable = false, length = 1000)
    private String textoBusqueda;

    public boolean esPublica() {
        return Boolean.TRUE.equals(publicado) && ambito == AmbitoGuia.PUBLICO_ASISTENCIAL;
    }

    public void recalcularTextoBusqueda() {
        String clavesStr = palabrasClave != null ? String.join(" ", palabrasClave) : "";
        String equiposStr = equiposCompatibles != null ? String.join(" ", equiposCompatibles) : "";
        this.textoBusqueda = NormalizadorBusqueda.componer(titulo, descripcionProblema, sintoma, causaRaiz, clavesStr, equiposStr);
    }
}
