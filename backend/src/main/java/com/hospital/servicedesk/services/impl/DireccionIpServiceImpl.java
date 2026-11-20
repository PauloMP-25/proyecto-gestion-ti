package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import com.hospital.servicedesk.services.DireccionIpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<DireccionIP> getDireccionesIpPaginadas(int pagina, int tamano, String estado) {
        List<DireccionIP> todas = ipRepo.findAll();

        List<DireccionIP> filtradas = todas.stream()
                .filter(ip -> {
                    if (estado != null && !estado.isBlank()) {
                        if (ip.getEstado() == null || !ip.getEstado().name().equalsIgnoreCase(estado)) return false;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    String dirA = a.getDireccion() != null ? a.getDireccion() : "";
                    String dirB = b.getDireccion() != null ? b.getDireccion() : "";
                    return dirA.compareTo(dirB);
                })
                .toList();

        return com.hospital.servicedesk.dtos.PaginaRespuesta.of(filtradas, pagina, tamano);
    }

    @Override
    @Transactional
    public DireccionIP createDireccionIp(Map<String, Object> req) {
        String direccion = (String) req.get("direccion");
        if (ipRepo.findByDireccion(direccion).isPresent()) {
            throw new ConflictoNegocioException("La dirección IP ya está registrada");
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
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección IP", idIp));

        if (ip.getEstado() == EstadoIP.ASIGNADA) {
            throw new ConflictoNegocioException("La dirección IP ya se encuentra asignada");
        }

        Integer idCi = (Integer) req.get("idCi");
        ElementoConfiguracion ci = ciRepo.findById(idCi)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo CI", idCi));

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
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección IP", idIp));

        ip.setEstado(EstadoIP.DISPONIBLE);
        ipRepo.save(ip);

        HistorialAsignacionIP active = historialIpRepo.findActiveAssignmentByIp(ip.getDireccion())
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay asignación activa para esta IP"));

        active.setFechaLiberacion(LocalDateTime.now());
        return historialIpRepo.save(active);
    }

    @Override
    public List<HistorialAsignacionIP> getHistorialIp(Integer idIp) {
        DireccionIP ip = ipRepo.findById(idIp)
                .orElseThrow(() -> new RecursoNoEncontradoException("Dirección IP", idIp));
        return historialIpRepo.findAll().stream()
                .filter(h -> h.getDireccionIp().getIdDireccionIp().equals(idIp))
                .toList();
    }
}
