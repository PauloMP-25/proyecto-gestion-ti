package com.hospital.servicedesk.administrativo.areas.aplicacion.impl;

import com.hospital.servicedesk.administrativo.areas.aplicacion.AreaConsultaService;
import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaMini;
import com.hospital.servicedesk.administrativo.areas.dto.AreaResumen;
import com.hospital.servicedesk.administrativo.areas.mapper.AreaMapper;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AreaConsultaServiceImpl implements AreaConsultaService {

    private final AreaRepository areaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ElementoConfiguracionRepository elementoRepository;
    private final AreaMapper areaMapper;

    public AreaConsultaServiceImpl(
            AreaRepository areaRepository,
            UsuarioRepository usuarioRepository,
            ElementoConfiguracionRepository elementoRepository,
            AreaMapper areaMapper
    ) {
        this.areaRepository = areaRepository;
        this.usuarioRepository = usuarioRepository;
        this.elementoRepository = elementoRepository;
        this.areaMapper = areaMapper;
    }

    @Override
    public List<AreaResumen> listar(String buscar, boolean incluirInactivas) {
        List<Area> areas;
        boolean tieneFiltro = buscar != null && !buscar.isBlank();
        String filtro = tieneFiltro ? buscar.trim() : null;

        if (incluirInactivas) {
            areas = tieneFiltro
                    ? areaRepository.findByNombreContainingIgnoreCaseOrderByNombreAsc(filtro)
                    : areaRepository.findAllByOrderByNombreAsc();
        } else {
            areas = tieneFiltro
                    ? areaRepository.findByActivoTrueAndNombreContainingIgnoreCaseOrderByNombreAsc(filtro)
                    : areaRepository.findByActivoTrueOrderByNombreAsc();
        }

        return areas.stream().map(a -> {
            long totalPersonal = usuarioRepository.countByArea_IdAreaAndActivoTrue(a.getIdArea());
            long totalComputadoras = elementoRepository.countByArea_IdAreaAndTipoCiAndEstado(a.getIdArea(), TipoCI.COMPUTADORA, EstadoCI.ACTIVO);
            long totalImpresoras = elementoRepository.countByArea_IdAreaAndTipoCiAndEstado(a.getIdArea(), TipoCI.IMPRESORA, EstadoCI.ACTIVO);
            return areaMapper.aResumen(a, totalPersonal, totalComputadoras, totalImpresoras);
        }).toList();
    }

    @Override
    public AreaDetalle obtener(Integer id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + id));

        long totalPersonal = usuarioRepository.countByArea_IdAreaAndActivoTrue(area.getIdArea());
        long totalComputadoras = elementoRepository.countByArea_IdAreaAndTipoCiAndEstado(area.getIdArea(), TipoCI.COMPUTADORA, EstadoCI.ACTIVO);
        long totalImpresoras = elementoRepository.countByArea_IdAreaAndTipoCiAndEstado(area.getIdArea(), TipoCI.IMPRESORA, EstadoCI.ACTIVO);

        return areaMapper.aDetalle(area, totalPersonal, totalComputadoras, totalImpresoras);
    }

    @Override
    public AreaMini obtenerMini(Integer id) {
        Area area = areaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área no encontrada con id: " + id));
        return areaMapper.aMini(area);
    }
}
