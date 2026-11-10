
package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import com.hospital.servicedesk.services.DireccionIpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DireccionIpServiceImpl implements DireccionIpService {

    private final DireccionIpRepository ipRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final HistorialAsignacionIpRepository historialIpRepo;

    @Override
    public List<DireccionIP> getAllDireccionesIp() {
        return ipRepo.findAll();
    }

    @Override
    @Transactional
    public DireccionIP createDireccionIp(Map<String, Object> req) {
        String direccion = (String) req.get("direccion");
        if (ipRepo.findByDireccion(direccion).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La dirección IP ya está registrada");
        }
        DireccionIP ip = DireccionIP.builder()
                .direccion(direccion)
                .subred((String) req.get("subred"))
                .estado(EstadoIP.DISPONIBLE)
                .build();
        return ipRepo.save(ip);
    }

    @Override
    @Transactional
    public HistorialAsignacionIP asignarIp(Integer idIp, Map<String, Object> req) {
        DireccionIP ip = ipRepo.findById(idIp)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dirección IP no encontrada"));

        if (ip.getEstado() == EstadoIP.ASIGNADA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La dirección IP ya se encuentra asignada");
        }

        Integer idCi = (Integer) req.get("idCi");
        ElementoConfiguracion ci = ciRepo.findById(idCi)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo CI no encontrado"));

        ip.setEstado(EstadoIP.ASIGNADA);
        ipRepo.save(ip);

        HistorialAsignacionIP historial = HistorialAsignacionIP.builder()
                .direccionIp(ip)
                .elementoConfiguracion(ci)
                .build();

        return historialIpRepo.save(historial);
    }

    @Override
    @Transactional
    public HistorialAsignacionIP liberarIp(Integer idIp) {
        DireccionIP ip = ipRepo.findById(idIp)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dirección IP no encontrada"));

        ip.setEstado(EstadoIP.DISPONIBLE);
        ipRepo.save(ip);

        HistorialAsignacionIP active = historialIpRepo.findActiveAssignmentByIp(ip.getDireccion())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay asignación activa para esta IP"));

        active.setFechaLiberacion(LocalDateTime.now());
        return historialIpRepo.save(active);
    }

    @Override
    public List<HistorialAsignacionIP> getHistorialIp(Integer idIp) {
        DireccionIP ip = ipRepo.findById(idIp)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dirección IP no encontrada"));
        return historialIpRepo.findAll().stream()
                .filter(h -> h.getDireccionIp().getIdDireccionIp().equals(idIp))
                .toList();
    }
}

