package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.Area;
import java.util.List;

public interface AreaService {
    List<Area> getAllAreas();
    Area createArea(String nombre, String anexo);
    Area updateArea(Integer id, String nombre, String anexo);
}
