package com.hospital.servicedesk.administrativo.areas.aplicacion.impl;

import com.hospital.servicedesk.administrativo.areas.aplicacion.AreaConsultaService;
import com.hospital.servicedesk.administrativo.areas.aplicacion.AreaGestionService;
import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaSolicitud;
import com.hospital.servicedesk.administrativo.areas.mapper.AreaMapper;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.administrativo.equipos.mapper.EquipoMapper;
import com.hospital.servicedesk.compartido.web.RespuestaConAdvertencias;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioResumen;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.mappers.UsuarioMapper;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AreaGestionServiceImpl implements AreaGestionService {

    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ElementoConfiguracionRepository elementoRepository;
    private final HistorialAsignacionIpRepository historialIpRepository;
    private final AreaConsultaService areaConsultaService;
    private final AreaMapper areaMapper;
    private final EquipoMapper equipoMapper;

    public AreaGestionServiceImpl(
            AreaRepository areaRepository,
            UsuarioRepository usuarioRepository,
            ElementoConfiguracionRepository elementoRepository,
            HistorialAsignacionIpRepository historialIpRepository,
            AreaConsultaService areaConsultaService,
            AreaMapper areaMapper,
            EquipoMapper equipoMapper
    ) {
        this.areaRepository = areaRepository;
        this.usuarioRepository = usuarioRepository;
        this.elementoRepository = elementoRepository;
        this.historialIpRepository = historialIpRepository;
        this.areaConsultaService = areaConsultaService;
        this.areaMapper = areaMapper;
        this.equipoMapper = equipoMapper;
    }

    @Override
    public AreaDetalle crear(AreaSolicitud solicitud) {
        validarUnicidadNombre(solicitud.nombre(), null);

        Usuario encargado = resolverEncargado(solicitud.idEncargado());
        Area nueva = areaMapper.aNuevaEntidad(solicitud, encargado);
        Area guardada = areaRepository.save(nueva);

        return areaConsultaService.obtener(guardada.getIdArea());
    }

    @Override
    public RespuestaConAdvertencias<AreaDetalle> actualizar(Integer id, AreaSolicitud solicitud) {
        Area existente = areaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + id));

        validarUnicidadNombre(solicitud.nombre(), id);

        List<String> advertencias = new ArrayList<>();
        Usuario encargado = null;
        if (solicitud.idEncargado() != null) {
            encargado = resolverEncargado(solicitud.idEncargado());
            if (encargado.getArea() == null || !id.equals(encargado.getArea().getIdArea())) {
                advertencias.add("El encargado seleccionado pertenece actualmente a otra área ("
                        + (encargado.getArea() != null ? encargado.getArea().getNombre() : "Sin área") + ")");
            }
        }

        areaMapper.aplicar(solicitud, existente, encargado);
        areaRepository.save(existente);

        AreaDetalle detalle = areaConsultaService.obtener(id);
        return new RespuestaConAdvertencias<>(detalle, advertencias);
    }

    @Override
    public AreaDetalle cambiarEstado(Integer id, boolean activo) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + id));

        if (!activo) {
            long totalPersonal = usuarioRepository.countByArea_IdAreaAndActivoTrue(id);
            long totalEquipos = elementoRepository.countByArea_IdAreaAndEstado(id, EstadoCI.ACTIVO);

            if (totalPersonal > 0 || totalEquipos > 0) {
                throw new ConflictoNegocioException("activo",
                        String.format("No se puede desactivar el área «%s» porque aún cuenta con %d colaborador(es) activo(s) y %d equipo(s) en servicio. Reasígnelos antes de desactivar.",
                                area.getNombre(), totalPersonal, totalEquipos));
            }
        }

        area.setActivo(activo);
        areaRepository.save(area);
        return areaConsultaService.obtener(id);
    }

    @Override
    public UsuarioResumen reasignarPersonal(Integer idArea, Integer idUsuario) {
        Area area = areaRepository.findById(idArea)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + idArea));

        if (!Boolean.TRUE.equals(area.getActivo())) {
            throw new ConflictoNegocioException("idArea", "No se puede reasignar personal a un área desactivada.");
        }

        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado con id: " + idUsuario));

        usuario.setArea(area);
        Usuario actualizado = usuarioRepository.save(usuario);
        return UsuarioMapper.toResumen(actualizado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResumen> listarPersonal(Integer idArea, boolean incluirInactivos) {
        if (!areaRepository.existsById(idArea)) {
            throw new RecursoNoEncontradoException("Área no encontrada con id: " + idArea);
        }

        List<Usuario> personal = incluirInactivos
                ? usuarioRepository.findByArea_IdAreaOrderByApellidosAscNombresAsc(idArea)
                : usuarioRepository.findByArea_IdAreaAndActivoTrueOrderByApellidosAscNombresAsc(idArea);

        return personal.stream().map(UsuarioMapper::toResumen).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EquipoResumen> listarEquipos(Integer idArea, TipoCI tipo) {
        if (!areaRepository.existsById(idArea)) {
            throw new RecursoNoEncontradoException("Área no encontrada con id: " + idArea);
        }

        List<ElementoConfiguracion> equipos = (tipo != null)
                ? elementoRepository.findByAreaIdAreaAndTipoCi(idArea, tipo)
                : elementoRepository.findByAreaIdArea(idArea);

        return equipos.stream().map(eq -> {
            Optional<HistorialAsignacionIP> asignacion =
                    historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(eq.getIdCi());
            String ipVigente = asignacion.map(h -> h.getDireccionIp().getDireccion()).orElse(null);
            return equipoMapper.aResumen(eq, ipVigente);
        }).toList();
    }

    private void validarUnicidadNombre(String nombre, Integer idExcluir) {
        Optional<Area> homonimo = areaRepository.findByNombreIgnoreCase(nombre);
        if (homonimo.isPresent()) {
            Area existente = homonimo.get();
            if (idExcluir == null || !existente.getIdArea().equals(idExcluir)) {
                if (!Boolean.TRUE.equals(existente.getActivo())) {
                    throw new ConflictoNegocioException("nombre",
                            "Ya existe un área «" + nombre + "» desactivada; puede reactivarla.");
                }
                throw new ConflictoNegocioException("nombre",
                        "Ya existe un área con el nombre «" + nombre + "»");
            }
        }
    }

    private Usuario resolverEncargado(Integer idEncargado) {
        if (idEncargado == null) {
            return null;
        }
        Usuario usuario = usuarioRepository.findById(idEncargado)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario encargado no encontrado con id: " + idEncargado));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ReglaNegocioException("idEncargado", "El encargado asignado debe ser un usuario activo.");
        }
        return usuario;
    }
}
