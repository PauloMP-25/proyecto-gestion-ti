import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 4A. Enums
write_file("backend/src/main/java/com/hospital/servicedesk/entities/CategoriaGuia.java", """package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum CategoriaGuia {
    SISTEMA_CLINICO(1, "Sistema clínico (HIS)"),
    IMPRESORAS_TERMICAS(2, "Impresoras de etiquetas y térmicas"),
    REDES(3, "Redes y conectividad"),
    HARDWARE(4, "Hardware y periféricos"),
    SOFTWARE_ASISTENCIAL(5, "Software asistencial");

    private final int id;
    private final String etiqueta;

    CategoriaGuia(int id, String etiqueta) { this.id = id; this.etiqueta = etiqueta; }

    public static CategoriaGuia desdeId(Integer id) {
        return Arrays.stream(values()).filter(c -> id != null && c.id == id).findFirst()
                .orElseThrow(() -> new com.hospital.servicedesk.exceptions.ReglaNegocioException(
                        "categoriaId", "Seleccione una categoría válida."));
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/AmbitoGuia.java", """package com.hospital.servicedesk.entities;

public enum AmbitoGuia {
    PUBLICO_ASISTENCIAL, INTERNO_TECNICO
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/NivelDificultad.java", """package com.hospital.servicedesk.entities;

public enum NivelDificultad {
    BASICO, INTERMEDIO, AVANZADO
}
""")

# 4B. Embeddable PasoSolucion & VotoGuia & Updated ErrorConocido
write_file("backend/src/main/java/com/hospital/servicedesk/entities/PasoSolucion.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasoSolucion {

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "advertencia", length = 300)
    private String advertencia;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/VotoGuia.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "guia_voto", uniqueConstraints = @UniqueConstraint(name = "UQ_guia_voto_usuario",
        columnNames = {"id_error", "id_usuario"}))
public class VotoGuia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_voto")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_error", nullable = false)
    private ErrorConocido guia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "es_util", nullable = false)
    private boolean esUtil;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/ErrorConocido.java", """package com.hospital.servicedesk.entities;

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
    @Column(name = \"publicado\", nullable = false)
    private Boolean publicado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaGuia categoria = CategoriaGuia.SOFTWARE_ASISTENCIAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = \"ambito\", nullable = false, length = 30)
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
    @Column(name = \"requiere_tecnico\", nullable = false)
    private boolean requiereTecnico = false;

    @Convert(converter = ListaCsvConverter.class)
    @Column(name = \"palabras_clave\", length = 500)
    @Builder.Default
    private List<String> palabrasClave = new ArrayList<>();

    @Convert(converter = ListaCsvConverter.class)
    @Column(name = \"equipos_compatibles\", length = 500)
    @Builder.Default
    private List<String> equiposCompatibles = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = \"guia_precaucion\", joinColumns = @JoinColumn(name = \"id_error\"))
    @OrderColumn(name = \"orden\")
    @Column(name = \"precaucion\", nullable = false, length = 300)
    @Builder.Default
    private List<String> precauciones = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = \"guia_paso\", joinColumns = @JoinColumn(name = \"id_error\"))
    @OrderColumn(name = \"orden\")
    @BatchSize(size = 20)
    @Builder.Default
    private List<PasoSolucion> pasos = new ArrayList<>();

    @Builder.Default
    @Column(name = \"conteo_util\", nullable = false)
    private int conteoUtil = 0;

    @Builder.Default
    @Column(name = \"conteo_no_util\", nullable = false)
    private int conteoNoUtil = 0;

    @Builder.Default
    @Column(name = \"conteo_visitas\", nullable = false)
    private int conteoVisitas = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = \"id_autor\")
    private Usuario autor;

    @Column(name = \"fecha_actualizacion\", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Column(name = \"texto_busqueda\", nullable = false, length = 1000)
    private String textoBusqueda;

    public boolean esPublica() {
        return Boolean.TRUE.equals(publicado) && ambito == AmbitoGuia.PUBLICO_ASISTENCIAL;
    }

    public void recalcularTextoBusqueda() {
        String clavesStr = palabrasClave != null ? String.join(\" \", palabrasClave) : \"\";
        String equiposStr = equiposCompatibles != null ? String.join(\" \", equiposCompatibles) : \"\";
        this.textoBusqueda = NormalizadorBusqueda.componer(titulo, descripcionProblema, sintoma, causaRaiz, clavesStr, equiposStr);
    }
}
""")

# 4C. Repositories & Specifications
write_file("backend/src/main/java/com/hospital/servicedesk/repositories/ErrorConocidoRepository.java", """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ErrorConocidoRepository extends JpaRepository<ErrorConocido, Integer>,
        JpaSpecificationExecutor<ErrorConocido> {

    List<ErrorConocido> findByPublicadoTrue();

    @Modifying
    @Query(\"update ErrorConocido e set e.conteoVisitas = e.conteoVisitas + 1 where e.idError = :id\")
    int incrementarVisitas(@Param(\"id\") Integer id);

    @Query(\"\"\"
            select e.categoria, count(e) from ErrorConocido e
            where e.publicado = true and (:soloPublicas = false or e.ambito = :publico)
            group by e.categoria
            \"\"\")
    List<Object[]> contarPorCategoria(@Param(\"soloPublicas\") boolean soloPublicas,
                                      @Param(\"publico\") AmbitoGuia publico);
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/repositories/VotoGuiaRepository.java", """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.VotoGuia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VotoGuiaRepository extends JpaRepository<VotoGuia, Integer> {
    Optional<VotoGuia> findByGuia_IdErrorAndUsuario_IdUsuario(Integer idGuia, Integer idUsuario);
    long countByGuia_IdErrorAndEsUtil(Integer idGuia, boolean esUtil);
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/infraestructura/EspecificacionesGuia.java", """package com.hospital.servicedesk.administrativo.conocimiento.infraestructura;

import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.AmbitoGuia;
import com.hospital.servicedesk.entities.ErrorConocido;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public final class EspecificacionesGuia {

    private EspecificacionesGuia() {}

    public static Specification<ErrorConocido> publicasOAccesoTotal(boolean soloPublicas, AmbitoGuia ambitoActor) {
        return (root, query, cb) -> {
            if (soloPublicas) {
                return cb.and(
                        cb.isTrue(root.get("publicado")),
                        cb.equal(root.get("ambito"), AmbitoGuia.PUBLICO_ASISTENCIAL)
                );
            }
            if (ambitoActor == AmbitoGuia.PUBLICO_ASISTENCIAL) {
                return cb.and(
                        cb.isTrue(root.get("publicado")),
                        cb.equal(root.get("ambito"), AmbitoGuia.PUBLICO_ASISTENCIAL)
                );
            }
            return cb.isTrue(root.get("publicado"));
        };
    }

    public static Specification<ErrorConocido> porCategoria(Integer categoriaId) {
        return (root, query, cb) -> categoriaId == null ? null : cb.equal(root.get("categoria"), com.hospital.servicedesk.entities.CategoriaGuia.desdeId(categoriaId));
    }

    public static Specification<ErrorConocido> porAmbito(AmbitoGuia ambito) {
        return (root, query, cb) -> ambito == null ? null : cb.equal(root.get("ambito"), ambito);
    }

    public static Specification<ErrorConocido> porTokens(List<String> tokens) {
        return (root, query, cb) -> {
            if (tokens == null || tokens.isEmpty()) return cb.conjunction();
            var predicates = tokens.stream()
                    .map(t -> cb.like(root.get("textoBusqueda"), "%" + NormalizadorBusqueda.normalizar(t) + "%"))
                    .toList();
            return cb.and(predicates.toArray(new org.springframework.persistence.criteria.Predicate[0]));
        };
    }
}
""")

# 4D. PuntuadorGuias
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/dominio/PuntuadorGuias.java", """package com.hospital.servicedesk.administrativo.conocimiento.dominio;

import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.ErrorConocido;

import java.util.Comparator;
import java.util.List;

public final class PuntuadorGuias {

    private PuntuadorGuias() {}

    public static int puntuar(ErrorConocido g, List<String> tokens) {
        String titulo = NormalizadorBusqueda.normalizar(g.getTitulo());
        String sintoma = NormalizadorBusqueda.normalizar(g.getSintoma());
        String claves = NormalizadorBusqueda.normalizar(String.join(" ", g.getPalabrasClave()));
        String equipos = NormalizadorBusqueda.normalizar(String.join(" ", g.getEquiposCompatibles()));
        String resumen = NormalizadorBusqueda.normalizar(g.getDescripcionProblema());
        int puntos = 0;
        for (String t : tokens) {
            if (titulo.contains(t))  puntos += 5;
            if (sintoma.contains(t)) puntos += 4;
            if (claves.contains(t))  puntos += 3;
            if (equipos.contains(t)) puntos += 2;
            if (resumen.contains(t)) puntos += 1;
        }
        return puntos;
    }

    public static List<ErrorConocido> ordenar(List<ErrorConocido> guias, List<String> tokens) {
        Comparator<ErrorConocido> porUtilidad = Comparator.comparingInt(ErrorConocido::getConteoUtil).reversed();
        Comparator<ErrorConocido> criterio = tokens.isEmpty() ? porUtilidad
                : Comparator.<ErrorConocido>comparingInt(g -> puntuar(g, tokens)).reversed().thenComparing(porUtilidad);
        return guias.stream().sorted(criterio.thenComparing(ErrorConocido::getIdError)).toList();
    }
}
""")

# 4E. DTOs
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/dto/GuiaDTOs.java", """package com.hospital.servicedesk.administrativo.conocimiento.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.hospital.servicedesk.entities.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class GuiaDTOs {

    private GuiaDTOs() {}

    public record PasoFormulario(
            @NotBlank(message = "Describa el paso.")
            @Size(max = 500, message = "Máximo 500 caracteres.") String descripcion,
            @Size(max = 300) String advertencia) {}

    public record GuiaFormulario(
            @NotBlank(message = "Escriba el título de la guía.")
            @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres.") String titulo,

            @NotBlank(message = "Escriba un resumen breve.")
            @JsonAlias("descripcionProblema")
            @Size(max = 2000) String resumen,

            @Size(max = 500) String sintoma,
            @Size(max = 1000) String causaRaiz,

            @NotBlank(message = "Describa la solución.")
            @JsonAlias("solucionTrabajo")
            @Size(max = 4000) String contenidoHtml,

            @NotNull(message = "Seleccione la categoría.") Integer categoriaId,
            @NotNull(message = "Seleccione el ámbito.") AmbitoGuia ambito,
            @NotNull(message = "Seleccione el nivel de dificultad.") NivelDificultad nivelDificultad,
            @Positive Integer minutosEstimados,
            boolean requiereTecnico,

            List<@NotBlank @Size(max = 50) String> palabrasClave,
            List<@NotBlank @Size(max = 30) String> equiposCompatibles,
            List<@Size(max = 300) String> precauciones,
            List<@Valid PasoFormulario> pasos) {}

    public record VotoFormulario(
            @NotNull(message = \"Indique si la guía le fue útil.\") Boolean util) {}

    public record PasoRespuesta(int orden, String descripcion, String advertencia) {}

    public record GuiaRespuesta(
            Integer id,
            String titulo,
            String resumen,
            CategoriaGuia categoria,
            AmbitoGuia ambito,
            NivelDificultad nivelDificultad,
            int minutosEstimados,
            boolean requiereTecnico,
            int conteoUtil,
            int conteoVisitas,
            boolean esUtilPorMi,
            @JsonFormat(pattern = \"yyyy-MM-dd'T'HH:mm:ss\") LocalDateTime fechaActualizacionIso,
            boolean requiereTecnicoBadge,
            String autorNombre,
            Integer idError,
            String descripcionProblema,
            String solucionTrabajo,
            boolean publicado,
            @JsonFormat(pattern = \"yyyy-MM-dd'T'HH:mm:ss\") LocalDateTime fechaCreacion) {}

    public record GuiaDetalleRespuesta(
            Integer id,
            String titulo,
            String resumen,
            String sintoma,
            String causaRaiz,
            String contenidoHtml,
            CategoriaGuia categoria,
            AmbitoGuia ambito,
            NivelDificultad nivelDificultad,
            int minutosEstimados,
            boolean requiereTecnico,
            List<String> palabrasClave,
            List<String> equiposCompatibles,
            List<String> precauciones,
            List<PasoRespuesta> pasos,
            int conteoUtil,
            int conteoNoUtil,
            int conteoVisitas,
            Boolean miVotoUtil,
            String autorNombre,
            Integer idError,
            String descripcionProblema,
            String solucionTrabajo,
            boolean publicado,
            @JsonFormat(pattern = \"yyyy-MM-dd'T'HH:mm:ss\") LocalDateTime fechaCreacion) {}

    public record ConteoCategoriaRespuesta(int id, String clave, String etiqueta, long total) {}
}
""")

# 4F. Service Interface & Impl
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/aplicacion/GuiaSolucionService.java", """package com.hospital.servicedesk.administrativo.conocimiento.aplicacion;

import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;

import java.util.List;

public interface GuiaSolucionService {
    PaginaRespuesta<GuiaRespuesta> buscar(String texto, Integer categoriaId, AmbitoGuia ambito,
                                          boolean soloPublicas, int pagina, int tamano, ContextoActor ctx);
    List<GuiaRespuesta> destacadas(int limite, ContextoActor ctx);
    GuiaRespuesta obtener(Integer id, ContextoActor ctx);
    List<ConteoCategoriaRespuesta> contarPorCategoria(ContextoActor ctx);
    GuiaRespuesta crear(GuiaFormulario f, ContextoActor ctx);
    GuiaRespuesta actualizar(Integer id, GuiaFormulario f, ContextoActor ctx);
    void archivar(Integer id, ContextoActor ctx);
    GuiaRespuesta votar(Integer id, boolean esUtil, ContextoActor ctx);
    void registrarVisita(Integer id, ContextoActor ctx);
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/aplicacion/impl/GuiaSolucionServiceImpl.java", """package com.hospital.servicedesk.administrativo.conocimiento.aplicacion.impl;

import com.hospital.servicedesk.administrativo.conocimiento.aplicacion.GuiaSolucionService;
import com.hospital.servicedesk.administrativo.conocimiento.dominio.PuntuadorGuias;
import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.administrativo.conocimiento.infraestructura.EspecificacionesGuia;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.ErrorConocidoRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.repositories.VotoGuiaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuiaSolucionServiceImpl implements GuiaSolucionService {

    private final ErrorConocidoRepository repository;
    private final VotoGuiaRepository votoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public PaginaRespuesta<GuiaRespuesta> buscar(String texto, Integer categoriaId, AmbitoGuia ambito,
                                                 boolean soloPublicas, int pagina, int tamano, ContextoActor ctx) {
        boolean publicaOnly = soloPublicas || (ctx == null || !ctx.esPersonalTecnico());
        Specification<ErrorConocido> spec = Specification.where(
                EspecificacionesGuia.publicasOAccesoTotal(publicaOnly, ctx != null && ctx.esPersonalTecnico() ? AmbitoGuia.INTERNO_TECNICO : AmbitoGuia.PUBLICO_ASISTENCIAL)
        ).and(EspecificacionesGuia.porCategoria(categoriaId))
         .and(EspecificacionesGuia.porAmbito(ambito));

        List<String> tokens = texto != null && !texto.isBlank() ? NormalizadorBusqueda.tokens(texto) : List.of();
        if (!tokens.isEmpty()) {
            spec = spec.and(EspecificacionesGuia.porTokens(tokens));
        }

        List<ErrorConocido> todas = repository.findAll(spec);
        List<ErrorConocido> ordenadas = PuntuadorGuias.ordenar(todas, tokens);

        int start = Math.min(pagina * tamano, ordenadas.size());
        int end = Math.min(start + tamano, ordenadas.size());
        List<ErrorConocido> paginaList = ordenadas.subList(start, end);

        List<GuiaRespuesta> contenido = paginaList.stream().map(g -> mapearResumen(g, ctx)).toList();
        return new PaginaRespuesta<>(contenido, pagina, tamano, ordenadas.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<GuiaRespuesta> destacadas(int limite, ContextoActor ctx) {
        boolean publicaOnly = ctx == null || !ctx.esPersonalTecnico();
        Specification<ErrorConocido> spec = EspecificacionesGuia.publicasOAccesoTotal(publicaOnly, AmbitoGuia.INTERNO_TECNICO);
        List<ErrorConocido> todas = repository.findAll(spec, Sort.by(Sort.Direction.DESC, "conteoUtil"));
        return todas.stream().limit(limite).map(g -> mapearResumen(g, ctx)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public GuiaRespuesta obtener(Integer id, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía no encontrada: " + id));
        if (!g.esPublica() && (ctx == null || !ctx.esPersonalTecnico())) {
            throw new RecursoNoEncontradoException("Guía no encontrada: " + id);
        }
        return mapearResumen(g, ctx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConteoCategoriaRespuesta> contarPorCategoria(ContextoActor ctx) {
        boolean publicaOnly = ctx == null || !ctx.esPersonalTecnico();
        List<Object[]> resultados = repository.contarPorCategoria(publicaOnly, AmbitoGuia.PUBLICO_ASISTENCIAL);
        Map<CategoriaGuia, Long> mapa = new EnumMap<>(CategoriaGuia.class);
        for (Object[] r : resultados) {
            mapa.put((CategoriaGuia) r[0], (Long) r[1]);
        }
        return Arrays.stream(CategoriaGuia.values())
                .map(cat -> new ConteoCategoriaRespuesta(cat.getId(), cat.name(), cat.getEtiqueta(), mapa.getOrDefault(cat, 0L)))
                .toList();
    }

    @Override
    @Transactional
    public GuiaRespuesta crear(GuiaFormulario f, ContextoActor ctx) {
        LocalDateTime ahora = LocalDateTime.now(clock);
        Usuario autor = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);

        ErrorConocido g = ErrorConocido.builder()
                .titulo(f.titulo().trim())
                .descripcionProblema(f.resumen().trim())
                .solucionTrabajo(f.contenidoHtml().trim())
                .publicado(true)
                .fechaCreacion(ahora)
                .categoria(CategoriaGuia.desdeId(f.categoriaId()))
                .ambito(f.ambito())
                .sintoma(f.sintoma())
                .causaRaiz(f.causaRaiz())
                .nivelDificultad(f.nivelDificultad())
                .minutosEstimados(f.minutosEstimados())
                .requiereTecnico(f.requiereTecnico())
                .palabrasClave(f.palabrasClave() != null ? f.palabrasClave() : new ArrayList<>())
                .equiposCompatibles(f.equiposCompatibles() != null ? f.equiposCompatibles() : new ArrayList<>())
                .precauciones(f.precauciones() != null ? f.precauciones() : new ArrayList<>())
                .pasos(f.pasos() != null ? f.pasos().stream().map(p -> new PasoSolucion(p.descripcion(), p.advertencia())).toList() : new ArrayList<>())
                .autor(autor)
                .fechaActualizacion(ahora)
                .build();

        g.recalcularTextoBusqueda();
        repository.save(g);
        log.info("Guía {} creada por {}", g.getIdError(), ctx.correo());
        return mapearResumen(g, ctx);
    }

    @Override
    @Transactional
    public GuiaRespuesta actualizar(Integer id, GuiaFormulario f, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía no encontrada: " + id));
        LocalDateTime ahora = LocalDateTime.now(clock);

        g.setTitulo(f.titulo().trim());
        g.setDescripcionProblema(f.resumen().trim());
        g.setSolucionTrabajo(f.contenidoHtml().trim());
        g.setCategoria(CategoriaGuia.desdeId(f.categoriaId()));
        g.setAmbito(f.ambito());
        g.setSintoma(f.sintoma());
        g.setCausaRaiz(f.causaRaiz());
        g.setNivelDificultad(f.nivelDificultad());
        g.setMinutosEstimados(f.minutosEstimados());
        g.setRequiereTecnico(f.requiereTecnico());
        g.setPalabrasClave(f.palabrasClave() != null ? f.palabrasClave() : new ArrayList<>());
        g.setEquiposCompatibles(f.equiposCompatibles() != null ? f.equiposCompatibles() : new ArrayList<>());
        g.setPrecauciones(f.precauciones() != null ? f.precauciones() : new ArrayList<>());
        g.setPasos(f.pasos() != null ? f.pasos().stream().map(p -> new PasoSolucion(p.descripcion(), p.advertencia())).toList() : new ArrayList<>());
        g.setFechaActualizacion(ahora);
        g.recalcularTextoBusqueda();

        repository.save(g);
        log.info("Guía {} actualizada por {}", id, ctx.correo());
        return mapearResumen(g, ctx);
    }

    @Override
    @Transactional
    public void archivar(Integer id, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía no encontrada: " + id));
        g.setPublicado(false);
        g.setFechaActualizacion(LocalDateTime.now(clock));
        repository.save(g);
        log.info("Guía {} archivada por {}", id, ctx.correo());
    }

    @Override
    @Transactional
    public GuiaRespuesta votar(Integer id, boolean esUtil, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía no encontrada: " + id));
        Usuario usuario = usuarioRepository.findByCorreo(ctx.correo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        Optional<VotoGuia> votoExistente = votoRepository.findByGuia_IdErrorAndUsuario_IdUsuario(id, usuario.getIdUsuario());
        LocalDateTime ahora = LocalDateTime.now(clock);

        if (votoExistente.isPresent()) {
            VotoGuia v = votoExistente.get();
            if (v.isEsUtil() != esUtil) {
                if (v.isEsUtil()) { g.setConteoUtil(Math.max(0, g.getConteoUtil() - 1)); g.setConteoNoUtil(g.getConteoNoUtil() + 1); }
                else { g.setConteoNoUtil(Math.max(0, g.getConteoNoUtil() - 1)); g.setConteoUtil(g.getConteoUtil() + 1); }
                v.setEsUtil(esUtil);
                v.setFecha(ahora);
                votoRepository.save(v);
            }
        } else {
            VotoGuia v = VotoGuia.builder().guia(g).usuario(usuario).esUtil(esUtil).fecha(ahora).build();
            votoRepository.save(v);
            if (esUtil) g.setConteoUtil(g.getConteoUtil() + 1);
            else g.setConteoNoUtil(g.getConteoNoUtil() + 1);
        }
        repository.save(g);
        return mapearResumen(g, ctx);
    }

    @Override
    @Transactional
    public void registrarVisita(Integer id, ContextoActor ctx) {
        repository.incrementarVisitas(id);
    }

    private GuiaRespuesta mapearResumen(ErrorConocido g, ContextoActor ctx) {
        boolean esUtilMi = false;
        if (ctx != null && ctx.correo() != null) {
            Usuario u = usuarioRepository.findByCorreo(ctx.correo()).orElse(null);
            if (u != null) {
                esUtilMi = votoRepository.findByGuia_IdErrorAndUsuario_IdUsuario(g.getIdError(), u.getIdUsuario())
                        .map(VotoGuia::isEsUtil).orElse(false);
            }
        }
        return new GuiaRespuesta(
                g.getIdError(),
                g.getTitulo(),
                g.getDescripcionProblema(),
                g.getCategoria(),
                g.getAmbito(),
                g.getNivelDificultad(),
                g.getMinutosEstimados() != null ? g.getMinutosEstimados() : 0,
                g.isRequiereTecnico(),
                g.getConteoUtil(),
                g.getConteoVisitas(),
                esUtilMi,
                g.getFechaActualizacion(),
                g.isRequiereTecnico(),
                g.getAutor() != null ? g.getAutor().getNombreVisible() : "Sistema",
                g.getIdError(),
                g.getDescripcionProblema(),
                g.getSolucionTrabajo(),
                Boolean.TRUE.equals(g.getPublicado()),
                g.getFechaCreacion()
        );
    }
}
""")

# 4G. Controller (replaces old ErrorConocidoController)
write_file("backend/src/main/java/com/hospital/servicedesk/administrativo/conocimiento/api/GuiaSolucionController.java", """package com.hospital.servicedesk.administrativo.conocimiento.api;

import com.hospital.servicedesk.administrativo.conocimiento.aplicacion.GuiaSolucionService;
import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;
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
@RequestMapping({"/api/conocimiento", "/api/kedb"})
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class GuiaSolucionController {

    private final GuiaSolucionService service;
    private final ResolutorContextoActor resolutorActor;

    @GetMapping
    public PaginaRespuesta<GuiaRespuesta> buscar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer categoriaId,
            @RequestParam(required = false) AmbitoGuia ambito,
            @RequestParam(defaultValue = "false") boolean soloPublicas,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            Authentication auth, HttpServletRequest request) {
        return service.buscar(texto, categoriaId, ambito, soloPublicas, pagina, tamano, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/destacadas")
    public List<GuiaRespuesta > destacadas(@RequestParam(defaultValue = "5") int limite,
                                           Authentication auth, HttpServletRequest request) {
        return service.destacadas(limite, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/conteos-categoria")
    public List<ConteoCategoriaRespuesta> contarPorCategoria(Authentication auth, HttpServletRequest request) {
        return service.contarPorCategoria(resolutorActor.resolver(auth, request));
    }

    @GetMapping("/{id}")
    public GuiaRespuesta obtener(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        return service.obtener(id, resolutorActor.resolver(auth, request));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    public ResponseEntity<GuiaRespuesta> crear(@Valid @RequestBody GuiaFormulario formulario,
                                               Authentication auth, HttpServletRequest request) {
        GuiaRespuesta creada = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/conocimiento/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    public GuiaRespuesta actualizar(@PathVariable Integer id, @Valid @RequestBody GuiaFormulario formulario,
                                     Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archivar(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.archivar(id, resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/votar")
    public GuiaRespuesta votar(@PathVariable Integer id, @Valid @RequestBody VotoFormulario voto,
                               Authentication auth, HttpServletRequest request) {
        return service.votar(id, voto.util(), resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/visita")
    @ResponseStatus(HttpStatus.OK)
    public void registrarVisita(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.registrarVisita(id, resolutorActor.resolver(auth, request));
    }
}
""")

# 4H. SQL Migration V1_4
write_file("backend/src/main/resources/db/migraciones/V1_4__centro_soluciones_guias.sql", """-- =============================================================================
-- Migración V1_4: Módulo 2 — Centro de Soluciones y Guías (KEDB)
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Ampliación de la tabla existente error_conocido ---------------------------
IF COL_LENGTH('dbo.error_conocido', 'categoria') IS NULL
    ALTER TABLE dbo.error_conocido ADD categoria VARCHAR(30) NOT NULL CONSTRAINT DF_ec_categoria DEFAULT ('SOFTWARE_ASISTENCIAL');

IF COL_LENGTH('dbo.error_conocido', 'ambito') IS NULL
    ALTER TABLE dbo.error_conocido ADD ambito VARCHAR(30) NOT NULL CONSTRAINT DF_ec_ambito DEFAULT ('PUBLICO_ASISTENCIAL');

IF COL_LENGTH('dbo.error_conocido', 'sintoma') IS NULL
    ALTER TABLE dbo.error_conocido ADD sintoma NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'causa_raiz') IS NULL
    ALTER TABLE dbo.error_conocido ADD causa_raiz NVARCHAR(1000) NULL;

IF COL_LENGTH('dbo.error_conocido', 'nivel_dificultad') IS NULL
    ALTER TABLE dbo.error_conocido ADD nivel_dificultad VARCHAR(20) NOT NULL CONSTRAINT DF_ec_dificultad DEFAULT ('BASICO');

IF COL_LENGTH('dbo.error_conocido', 'minutos_estimados') IS NULL
    ALTER TABLE dbo.error_conocido ADD minutos_estimados INT NULL;

IF COL_LENGTH('dbo.error_conocido', 'requiere_tecnico') IS NULL
    ALTER TABLE dbo.error_conocido ADD requiere_tecnico BIT NOT NULL CONSTRAINT DF_ec_req_tec DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'palabras_clave') IS NULL
    ALTER TABLE dbo.error_conocido ADD palabras_clave VARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'equipos_compatibles') IS NULL
    ALTER TABLE dbo.error_conocido ADD equipos_compatibles VARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'conteo_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_util INT NOT NULL CONSTRAINT DF_ec_c_util DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'conteo_no_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_no_util INT NOT NULL CONSTRAINT DF_ec_c_noutil DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'conteo_visitas') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_visitas INT NOT NULL CONSTRAINT DF_ec_c_visitas DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'id_autor') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD id_autor INT NULL;
    ALTER TABLE dbo.error_conocido ADD CONSTRAINT FK_ec_autor FOREIGN KEY (id_autor) REFERENCES dbo.usuario(id_usuario);
END;

IF COL_LENGTH('dbo.error_conocido', 'fecha_actualizacion') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD fecha_actualizacion DATETIME2(0) NOT NULL CONSTRAINT DF_ec_f_act DEFAULT (GETDATE());
END;

IF COL_LENGTH('dbo.error_conocido', 'texto_busqueda') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD texto_busqueda NVARCHAR(1000) NOT NULL CONSTRAINT DF_ec_t_busq DEFAULT ('');
END;

-- 2. Nuevas tablas secundarias de guías ----------------------------------------
IF OBJECT_ID('dbo.guia_precaucion', 'U') IS NULL
    CREATE TABLE dbo.guia_precaucion (
        id_error   INT           NOT NULL,
        orden      INT           NOT NULL,
        precaucion NVARCHAR(300) NOT NULL,
        CONSTRAINT PK_guia_precaucion PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_gp_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_paso', 'U') IS NULL
    CREATE TABLE dbo.guia_paso (
        id_error    INT           NOT NULL,
        orden       INT           NOT NULL,
        descripcion NVARCHAR(500) NOT NULL,
        advertencia NVARCHAR(300) NULL,
        CONSTRAINT PK_guia_paso PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_gpaso_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_voto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.guia_voto (
        id_voto    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_guia_voto PRIMARY KEY,
        id_error   INT               NOT NULL,
        id_usuario INT               NOT NULL,
        es_util    BIT               NOT NULL,
        fecha      DATETIME2(0)      NOT NULL,
        CONSTRAINT UQ_guia_voto_usuario UNIQUE (id_error, id_usuario),
        CONSTRAINT FK_gv_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE,
        CONSTRAINT FK_gv_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_gv_error ON dbo.guia_voto (id_error);
END;

COMMIT TRANSACTION;
""")

print("Phase 4 files written successfully.")
