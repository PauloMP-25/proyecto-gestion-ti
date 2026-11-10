
package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import java.util.List;
import java.util.Map;

public interface DireccionIpService {
    List<DireccionIP> getAllDireccionesIp();
    DireccionIP createDireccionIp(Map<String, Object> request);
    HistorialAsignacionIP asignarIp(Integer idIp, Map<String, Object> request);
    HistorialAsignacionIP liberarIp(Integer idIp);
    List<HistorialAsignacionIP> getHistorialIp(Integer idIp);
}

