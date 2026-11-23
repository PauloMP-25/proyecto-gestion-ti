package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.services.EquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    @Transactional(readOnly = true)
    public com.hospital.servicedesk.dtos.PaginaRespuesta<ElementoConfiguracion> getEquiposPaginados(
            int pagina,
            int tamano,
            Integer idArea,
            String tipoCi,
            String texto) {
        List<ElementoConfiguracion> todos = ciRepo.findAll();

        List<ElementoConfiguracion> filtrados = todos.stream()
                .filter(ci -> {
                    if (idArea != null && idArea > 0) {
                        if (ci.getArea() == null || !idArea.equals(ci.getArea().getIdArea())) return false;
                    }
                    if (tipoCi != null && !tipoCi.isBlank()) {
                        if (ci.getTipoCi() == null || !ci.getTipoCi().name().equalsIgnoreCase(tipoCi)) return false;
                    }
                    if (texto != null && !texto.isBlank()) {
                        String t = texto.toLowerCase().trim();
                        boolean matchNom = ci.getNombre() != null && ci.getNombre().toLowerCase().contains(t);
                        boolean matchHost = ci.getHostname() != null && ci.getHostname().toLowerCase().contains(t);
                        return matchNom || matchHost;
                    }
                    return true;
                })
                .sorted((a, b) -> {
                    String nomA = a.getNombre() != null ? a.getNombre() : "";
                    String nomB = b.getNombre() != null ? b.getNombre() : "";
                    return nomA.compareToIgnoreCase(nomB);
                })
                .toList();

        return com.hospital.servicedesk.dtos.PaginaRespuesta.of(filtrados, pagina, tamano);
    }

    @Override
    public ElementoConfiguracion getEquipoById(Integer id) {
        return ciRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo", id));
    }

    @Override
    @Transactional
    public ElementoConfiguracion createEquipo(Map<String, Object> req) {
        Integer idArea = (Integer) req.get("idArea");
        Area area = areaRepo.findById(idArea)
                .orElseThrow(() -> new RecursoNoEncontradoException("Área", idArea));

        ElementoConfiguracion ci = ElementoConfiguracion.builder()
                .nombre((String) req.get("nombre"))
                .tipoCi(TipoCI.valueOf((String) req.get("tipoCi")))
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
