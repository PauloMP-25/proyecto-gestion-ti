package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.DashboardDTOs.DashboardRespuestaDTO;

import java.util.Map;

public interface IndicadoresService {
    Map<String, Object> getKpis();
    DashboardRespuestaDTO getDashboard();
}
