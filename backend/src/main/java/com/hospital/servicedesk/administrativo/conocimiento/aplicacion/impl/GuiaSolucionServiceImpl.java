package com.hospital.servicedesk.administrativo.conocimiento.aplicacion.impl;

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
        return PaginaRespuesta.of(contenido, pagina, tamano);
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
