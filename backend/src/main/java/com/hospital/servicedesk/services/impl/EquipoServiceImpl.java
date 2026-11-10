
package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.services.EquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EquipoServiceImpl implements EquipoService {

    private final ElementoConfiguracionRepository ciRepo;
    private final AreaRepository areaRepo;

    @Override
    public List<ElementoConfiguracion> getAllEquipos() {
        return ciRepo.findAll();
    }

    @Override
    public ElementoConfiguracion getEquipoById(Integer id) {
        return ciRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado"));
    }

    @Override
    @Transactional
    public ElementoConfiguracion createEquipo(Map<String, Object> req) {
        Integer idArea = (Integer) req.get("idArea");
        Area area = areaRepo.findById(idArea)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));

        ElementoConfiguracion ci = ElementoConfiguracion.builder()
                .nombre((String) req.get("nombre"))
                .tipoCi(TipoCI.valueOf((String) req.get("tipoCi")))
                .mac((String) req.get("mac"))
                .hostname((String) req.get("hostname"))
                .area(area)
                .estado(EstadoCI.ACTIVO)
                .build();

        return ciRepo.save(ci);
    }

    @Override
    @Transactional
    public ElementoConfiguracion updateEquipo(Integer id, Map<String, Object> req) {
        ElementoConfiguracion ci = getEquipoById(id);
        if (req.get("nombre") != null) ci.setNombre((String) req.get("nombre"));
        if (req.get("tipoCi") != null) ci.setTipoCi(TipoCI.valueOf((String) req.get("tipoCi")));
        if (req.get("mac") != null) ci.setMac((String) req.get("mac"));
        if (req.get("hostname") != null) ci.setHostname((String) req.get("hostname"));
        if (req.get("idArea") != null) {
            Integer idArea = (Integer) req.get("idArea");
            Area area = areaRepo.findById(idArea).orElse(null);
            if (area != null) ci.setArea(area);
        }
        return ciRepo.save(ci);
    }

    @Override
    @Transactional
    public ElementoConfiguracion updateEstado(Integer id, String estado) {
        ElementoConfiguracion ci = getEquipoById(id);
        ci.setEstado(EstadoCI.valueOf(estado));
        return ciRepo.save(ci);
    }
}

