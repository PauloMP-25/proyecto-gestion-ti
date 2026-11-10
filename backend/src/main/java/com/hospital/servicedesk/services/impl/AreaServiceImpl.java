package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.services.AreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaServiceImpl implements AreaService {

    private final AreaRepository areaRepo;

    @Override
    public List<Area> getAllAreas() {
        return areaRepo.findAll();
    }

    @Override
    @Transactional
    public Area createArea(String nombre, String anexo) {
        Area area = Area.builder()
                .nombre(nombre)
                .anexo(anexo)
                .build();
        return areaRepo.save(area);
    }

    @Override
    @Transactional
    public Area updateArea(Integer id, String nombre, String anexo) {
        Area area = areaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área no encontrada"));
        area.setNombre(nombre);
        area.setAnexo(anexo);
        return areaRepo.save(area);
    }
}
