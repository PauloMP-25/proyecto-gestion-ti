package com.hospital.servicedesk.administrativo.equipos.aplicacion.impl;

import com.hospital.servicedesk.administrativo.equipos.aplicacion.AsignacionIpService;
import com.hospital.servicedesk.administrativo.equipos.aplicacion.EquipoConsultaService;
import com.hospital.servicedesk.administrativo.equipos.aplicacion.EquipoGestionService;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoSolicitud;
import com.hospital.servicedesk.administrativo.equipos.mapper.EquipoMapper;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class EquipoGestionServiceImpl implements EquipoGestionService {

    private final ElementoConfiguracionRepository equipoRepository;
    private final AreaRepository areaRepository;
    private final AsignacionIpService asignacionIpService;
    private final EquipoConsultaService equipoConsultaService;
    private final EquipoMapper equipoMapper;

    public EquipoGestionServiceImpl(
            ElementoConfiguracionRepository equipoRepository,
            AreaRepository areaRepository,
            AsignacionIpService asignacionIpService,
            EquipoConsultaService equipoConsultaService,
            EquipoMapper equipoMapper
    ) {
        this.equipoRepository = equipoRepository;
        this.areaRepository = areaRepository;
        this.asignacionIpService = asignacionIpService;
        this.equipoConsultaService = equipoConsultaService;
        this.equipoMapper = equipoMapper;
    }

    @Override
    public EquipoDetalle crear(EquipoSolicitud solicitud, Usuario usuarioOperador) {
        if (equipoRepository.existsByCodigoInventarioIgnoreCase(solicitud.codigoInventario())) {
            throw new ConflictoNegocioException("codigoInventario",
                    "Ya existe un equipo con el código de inventario " + solicitud.codigoInventario());
        }

        Area area = areaRepository.findById(solicitud.idArea())
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + solicitud.idArea()));

        if (!Boolean.TRUE.equals(area.getActivo())) {
            throw new ConflictoNegocioException("idArea", "No se puede adscribir un equipo a un área desactivada.");
        }

        ElementoConfiguracion nuevo = equipoMapper.aNuevaEntidad(solicitud, area);
        ElementoConfiguracion guardado = equipoRepository.save(nuevo);

        if (solicitud.ipEstatica() != null && !solicitud.ipEstatica().isBlank()) {
            asignacionIpService.asignarIpAEquipo(guardado, solicitud.ipEstatica(), usuarioOperador);
        }

        return equipoConsultaService.obtener(guardado.getIdCi());
    }

    @Override
    public EquipoDetalle actualizar(Integer id, EquipoSolicitud solicitud, Usuario usuarioOperador) {
        ElementoConfiguracion existente = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));

        Optional<ElementoConfiguracion> conMismoCodigo =
                equipoRepository.findByCodigoInventarioIgnoreCase(solicitud.codigoInventario());
        if (conMismoCodigo.isPresent() && !conMismoCodigo.get().getIdCi().equals(id)) {
            throw new ConflictoNegocioException("codigoInventario",
                    "Ya existe otro equipo con el código de inventario " + solicitud.codigoInventario());
        }

        Area area = areaRepository.findById(solicitud.idArea())
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + solicitud.idArea()));

        equipoMapper.aplicar(solicitud, existente, area);
        equipoRepository.save(existente);

        if (solicitud.ipEstatica() != null && !solicitud.ipEstatica().isBlank()) {
            asignacionIpService.asignarIpAEquipo(existente, solicitud.ipEstatica(), usuarioOperador);
        } else {
            asignacionIpService.liberarIpDeEquipo(existente, usuarioOperador);
        }

        return equipoConsultaService.obtener(id);
    }

    @Override
    public EquipoDetalle cambiarEstado(Integer id, EstadoCI estado, Usuario usuarioOperador) {
        ElementoConfiguracion equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));

        equipo.setEstado(estado);
        if (estado == EstadoCI.DADO_DE_BAJA) {
            asignacionIpService.liberarIpDeEquipo(equipo, usuarioOperador);
        }

        equipoRepository.save(equipo);
        return equipoConsultaService.obtener(id);
    }

    @Override
    public EquipoDetalle asignarIp(Integer id, String ipEstatica, Usuario usuarioOperador) {
        ElementoConfiguracion equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));

        asignacionIpService.asignarIpAEquipo(equipo, ipEstatica, usuarioOperador);
        return equipoConsultaService.obtener(id);
    }

    @Override
    public EquipoDetalle liberarIp(Integer id, Usuario usuarioOperador) {
        ElementoConfiguracion equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));

        asignacionIpService.liberarIpDeEquipo(equipo, usuarioOperador);
        return equipoConsultaService.obtener(id);
    }
}
