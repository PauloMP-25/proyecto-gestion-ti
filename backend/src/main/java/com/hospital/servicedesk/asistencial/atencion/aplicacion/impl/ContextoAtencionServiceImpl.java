package com.hospital.servicedesk.asistencial.atencion.aplicacion.impl;

import com.hospital.servicedesk.asistencial.atencion.aplicacion.ContextoAtencionService;
import com.hospital.servicedesk.asistencial.atencion.dominio.EstadoDeteccion;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.AreaContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.EquipoContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.ImpresoraAreaRespuesta;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta.PersonaContextoRespuesta;
import com.hospital.servicedesk.asistencial.atencion.mapper.ContextoAtencionMapper;
import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ContextoAtencionServiceImpl implements ContextoAtencionService {

    private final HistorialAsignacionIpRepository historialIpRepository;
    private final DireccionIpRepository direccionIpRepository;
    private final ElementoConfiguracionRepository elementoRepository;
    private final ContextoAtencionMapper mapper;

    public ContextoAtencionServiceImpl(
            HistorialAsignacionIpRepository historialIpRepository,
            DireccionIpRepository direccionIpRepository,
            ElementoConfiguracionRepository elementoRepository,
            ContextoAtencionMapper mapper
    ) {
        this.historialIpRepository = historialIpRepository;
        this.direccionIpRepository = direccionIpRepository;
        this.elementoRepository = elementoRepository;
        this.mapper = mapper;
    }

    @Override
    public ContextoAtencionRespuesta resolver(String ipOrigen, Usuario usuarioAutenticado) {
        String ipLimpia = (ipOrigen != null && !ipOrigen.isBlank()) ? ipOrigen.trim() : "127.0.0.1";
        PersonaContextoRespuesta personaDto = mapper.aPersonaRespuesta(usuarioAutenticado);

        Optional<HistorialAsignacionIP> asignacion =
                historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull(ipLimpia);

        if (asignacion.isPresent()) {
            ElementoConfiguracion equipo = asignacion.get().getElementoConfiguracion();
            Area area = equipo.getArea();

            if (equipo.getEstado() == EstadoCI.ACTIVO && area != null && Boolean.TRUE.equals(area.getActivo())) {
                EquipoContextoRespuesta equipoDto = mapper.aEquipoRespuesta(equipo);
                AreaContextoRespuesta areaDto = mapper.aAreaRespuesta(area);

                // Algoritmo de impresoras activas del área con asignación IP vigente
                List<ImpresoraAreaRespuesta> impresorasArea = resolverImpresorasArea(area.getIdArea());

                boolean personaEnOtraArea = false;
                if (usuarioAutenticado != null && usuarioAutenticado.getArea() != null) {
                    personaEnOtraArea = !area.getIdArea().equals(usuarioAutenticado.getArea().getIdArea());
                }

                return new ContextoAtencionRespuesta(
                        EstadoDeteccion.DETECTADO,
                        ipLimpia,
                        equipoDto,
                        areaDto,
                        impresorasArea,
                        personaDto,
                        personaEnOtraArea
                );
            }
        }

        // Si no hay asignación vigente o el equipo/área está inactivo
        boolean ipRegistrada = direccionIpRepository.findByDireccion(ipLimpia).isPresent();
        EstadoDeteccion estado = ipRegistrada ? EstadoDeteccion.IP_SIN_EQUIPO : EstadoDeteccion.IP_NO_REGISTRADA;

        return new ContextoAtencionRespuesta(
                estado,
                ipLimpia,
                null,
                null,
                List.of(),
                personaDto,
                false
        );
    }

    private List<ImpresoraAreaRespuesta> resolverImpresorasArea(Integer idArea) {
        List<ElementoConfiguracion> impresoras =
                elementoRepository.findByAreaIdAreaAndTipoCiAndEstado(idArea, TipoCI.IMPRESORA, EstadoCI.ACTIVO);

        List<ImpresoraAreaRespuesta> resultado = new ArrayList<>();
        for (ElementoConfiguracion imp : impresoras) {
            Optional<HistorialAsignacionIP> asignacion =
                    historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(imp.getIdCi());
            if (asignacion.isPresent()) {
                String ipEstatica = asignacion.get().getDireccionIp().getDireccion();
                resultado.add(mapper.aImpresoraRespuesta(imp, ipEstatica));
            }
        }

        resultado.sort(Comparator.comparing(
                ImpresoraAreaRespuesta::codigoInventario,
                Comparator.nullsLast(String::compareToIgnoreCase)
        ));
        return resultado;
    }
}
