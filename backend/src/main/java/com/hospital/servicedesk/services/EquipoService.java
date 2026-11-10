
package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import java.util.List;
import java.util.Map;

public interface EquipoService {
    List<ElementoConfiguracion> getAllEquipos();
    ElementoConfiguracion getEquipoById(Integer id);
    ElementoConfiguracion createEquipo(Map<String, Object> request);
    ElementoConfiguracion updateEquipo(Integer id, Map<String, Object> request);
    ElementoConfiguracion updateEstado(Integer id, String estado);
}

