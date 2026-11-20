package com.hospital.servicedesk.administrativo.areas.aplicacion;

import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaMini;
import com.hospital.servicedesk.administrativo.areas.dto.AreaResumen;

import java.util.List;

/**
 * Puerto de lectura (Query / Read Service) para áreas hospitalarias.
 */
public interface AreaConsultaService {

    List<AreaResumen> listar(String buscar, boolean incluirInactivas);

    AreaDetalle obtener(Integer id);

    AreaMini obtenerMini(Integer id);
}
