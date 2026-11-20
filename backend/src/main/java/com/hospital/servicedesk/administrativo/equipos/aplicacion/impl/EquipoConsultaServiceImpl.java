package com.hospital.servicedesk.administrativo.equipos.aplicacion.impl;

import com.hospital.servicedesk.administrativo.equipos.aplicacion.AsignacionIpService;
import com.hospital.servicedesk.administrativo.equipos.aplicacion.EquipoConsultaService;
import com.hospital.servicedesk.administrativo.equipos.dominio.codigo.EstrategiaCodigoInventario;
import com.hospital.servicedesk.administrativo.equipos.dto.CodigoSugeridoRespuesta;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.administrativo.equipos.mapper.EquipoMapper;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EquipoConsultaServiceImpl implements EquipoConsultaService {

    private final ElementoConfiguracionRepository equipoRepository;
    private final AreaRepository areaRepository;
    private final HistorialAsignacionIpRepository historialIpRepository;
    private final AsignacionIpService asignacionIpService;
    private final EstrategiaCodigoInventario estrategiaCodigo;
    private final EquipoMapper equipoMapper;

    public EquipoConsultaServiceImpl(
            ElementoConfiguracionRepository equipoRepository,
            AreaRepository areaRepository,
            HistorialAsignacionIpRepository historialIpRepository,
            AsignacionIpService asignacionIpService,
            EstrategiaCodigoInventario estrategiaCodigo,
            EquipoMapper equipoMapper
    ) {
        this.equipoRepository = equipoRepository;
        this.areaRepository = areaRepository;
        this.historialIpRepository = historialIpRepository;
        this.asignacionIpService = asignacionIpService;
        this.estrategiaCodigo = estrategiaCodigo;
        this.equipoMapper = equipoMapper;
    }

    @Override
    public PaginaRespuesta<EquipoResumen> listar(
            Integer idArea,
            TipoCI tipo,
            EstadoCI estado,
            Boolean sinIp,
            String buscar,
            Pageable pageable
    ) {
        List<ElementoConfiguracion> todos;
        if (idArea != null) {
            todos = (tipo != null)
                    ? equipoRepository.findByAreaIdAreaAndTipoCi(idArea, tipo)
                    : equipoRepository.findByAreaIdArea(idArea);
        } else {
            todos = equipoRepository.findAll();
        }

        String termino = (buscar != null && !buscar.isBlank()) ? buscar.trim().toLowerCase() : null;

        List<EquipoResumen> filtrados = todos.stream()
                .filter(eq -> estado == null || eq.getEstado() == estado)
                .filter(eq -> tipo == null || idArea != null || eq.getTipoCi() == tipo)
                .filter(eq -> termino == null ||
                        (eq.getCodigoInventario() != null && eq.getCodigoInventario().toLowerCase().contains(termino)) ||
                        (eq.getNombre() != null && eq.getNombre().toLowerCase().contains(termino)) ||
                        (eq.getHostname() != null && eq.getHostname().toLowerCase().contains(termino)) ||
                        (eq.getMarcaModelo() != null && eq.getMarcaModelo().toLowerCase().contains(termino)))
                .map(eq -> {
                    String ip = asignacionIpService.obtenerIpVigente(eq.getIdCi()).orElse(null);
                    return equipoMapper.aResumen(eq, ip);
                })
                .filter(dto -> sinIp == null || !sinIp || dto.ipVigente() == null)
                .toList();

        // Paginación en memoria si se usó filtrado en stream, o subList
        int inicio = (int) pageable.getOffset();
        int fin = Math.min((inicio + pageable.getPageSize()), filtrados.size());
        List<EquipoResumen> paginaLista = (inicio <= fin) ? filtrados.subList(inicio, fin) : List.of();

        Page<EquipoResumen> page = new PageImpl<>(paginaLista, pageable, filtrados.size());
        return PaginaRespuesta.from(page);
    }

    @Override
    public EquipoDetalle obtener(Integer id) {
        ElementoConfiguracion equipo = equipoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + id));

        String ipVigente = asignacionIpService.obtenerIpVigente(id).orElse(null);
        List<HistorialAsignacionIP> historial = historialIpRepository.findByElementoConfiguracion_IdCiOrderByFechaAsignacionDesc(id);

        return equipoMapper.aDetalle(equipo, ipVigente, historial);
    }

    @Override
    public CodigoSugeridoRespuesta sugerirCodigo(TipoCI tipo, Integer idArea) {
        Area area = areaRepository.findById(idArea)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + idArea));

        String codigo = estrategiaCodigo.sugerir(tipo, area);
        return new CodigoSugeridoRespuesta(codigo);
    }
}
