package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.OpcionCatalogoRespuesta;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.services.CatalogoService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CatalogoServiceImpl implements CatalogoService {

    @Override
    public List<OpcionCatalogoRespuesta> getGradosProfesionales() {
        GradoProfesional[] valores = GradoProfesional.values();
        return Arrays.stream(valores)
                .map(g -> new OpcionCatalogoRespuesta(
                        g.name(),
                        g.getPrefijo(),
                        g.getDescripcion(),
                        g.ordinal() + 1
                ))
                .toList();
    }
}
