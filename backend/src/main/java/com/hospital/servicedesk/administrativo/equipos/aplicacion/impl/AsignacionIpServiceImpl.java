package com.hospital.servicedesk.administrativo.equipos.aplicacion.impl;

import com.hospital.servicedesk.administrativo.equipos.aplicacion.AsignacionIpService;
import com.hospital.servicedesk.administrativo.equipos.dominio.ip.ValidadorIp;
import com.hospital.servicedesk.administrativo.equipos.dto.DisponibilidadIpRespuesta;
import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.repositories.DireccionIpRepository;
import com.hospital.servicedesk.repositories.HistorialAsignacionIpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class AsignacionIpServiceImpl implements AsignacionIpService {

    private final DireccionIpRepository direccionIpRepository;
    private final HistorialAsignacionIpRepository historialIpRepository;
    private final ValidadorIp validadorIp;
    private final Clock clock;

    public AsignacionIpServiceImpl(
            DireccionIpRepository direccionIpRepository,
            HistorialAsignacionIpRepository historialIpRepository,
            ValidadorIp validadorIp,
            Clock clock
    ) {
        this.direccionIpRepository = direccionIpRepository;
        this.historialIpRepository = historialIpRepository;
        this.validadorIp = validadorIp;
        this.clock = clock;
    }

    @Override
    public void asignarIpAEquipo(ElementoConfiguracion equipo, String ipEstatica, Usuario usuarioOperador) {
        if (ipEstatica == null || ipEstatica.isBlank()) {
            return;
        }

        String ip = ipEstatica.trim();
        validadorIp.validarOExcepcion(ip);

        // Verificar si la IP ya está asignada a otro equipo activo
        Optional<HistorialAsignacionIP> asignacionExistente =
                historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull(ip);

        if (asignacionExistente.isPresent()) {
            HistorialAsignacionIP asignada = asignacionExistente.get();
            if (!asignada.getElementoConfiguracion().getIdCi().equals(equipo.getIdCi())) {
                String codigoOtro = asignada.getElementoConfiguracion().getCodigoInventario();
                throw new ConflictoNegocioException("ipEstatica",
                        String.format("La dirección IP %s ya está asignada a %s", ip, codigoOtro));
            } else {
                // Ya la tiene este mismo equipo
                return;
            }
        }

        // Si el equipo ya tiene otra IP asignada actualmente, liberarla
        Optional<HistorialAsignacionIP> actualDelEquipo =
                historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(equipo.getIdCi());

        if (actualDelEquipo.isPresent()) {
            HistorialAsignacionIP actual = actualDelEquipo.get();
            if (!actual.getDireccionIp().getDireccion().equals(ip)) {
                liberarIpDeEquipo(equipo, usuarioOperador);
            }
        }

        // Obtener o registrar la entidad DireccionIP
        DireccionIP direccion = direccionIpRepository.findByDireccion(ip)
                .orElseGet(() -> direccionIpRepository.save(DireccionIP.builder()
                        .direccion(ip)
                        .estado(EstadoIP.ASIGNADA)
                        .build()));

        direccion.setEstado(EstadoIP.ASIGNADA);
        direccionIpRepository.save(direccion);

        // Registrar nueva asignación en el historial
        HistorialAsignacionIP nuevaAsignacion = HistorialAsignacionIP.builder()
                .direccionIp(direccion)
                .elementoConfiguracion(equipo)
                .usuarioAsigno(usuarioOperador)
                .fechaAsignacion(LocalDateTime.now(clock))
                .build();

        historialIpRepository.save(nuevaAsignacion);
    }

    @Override
    public void liberarIpDeEquipo(ElementoConfiguracion equipo, Usuario usuarioOperador) {
        Optional<HistorialAsignacionIP> activa =
                historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(equipo.getIdCi());

        if (activa.isPresent()) {
            HistorialAsignacionIP asignacion = activa.get();
            asignacion.setFechaLiberacion(LocalDateTime.now(clock));
            asignacion.setUsuarioLibero(usuarioOperador);
            historialIpRepository.save(asignacion);

            DireccionIP ip = asignacion.getDireccionIp();
            if (ip != null) {
                boolean aunEnUso = historialIpRepository.existsByDireccionIp_DireccionAndFechaLiberacionIsNull(ip.getDireccion());
                if (!aunEnUso) {
                    ip.setEstado(EstadoIP.DISPONIBLE);
                    direccionIpRepository.save(ip);
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DisponibilidadIpRespuesta verificarDisponibilidad(String ip, Integer idEquipoExcluir) {
        if (ip == null || ip.isBlank()) {
            return DisponibilidadIpRespuesta.noValida("La dirección IP no puede estar vacía");
        }

        Optional<String> violacion = validadorIp.evaluar(ip);
        if (violacion.isPresent()) {
            return DisponibilidadIpRespuesta.noValida(violacion.get());
        }

        Optional<HistorialAsignacionIP> asignacion =
                historialIpRepository.findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull(ip.trim());

        if (asignacion.isPresent()) {
            ElementoConfiguracion equipoAsignado = asignacion.get().getElementoConfiguracion();
            if (idEquipoExcluir != null && equipoAsignado.getIdCi().equals(idEquipoExcluir)) {
                return DisponibilidadIpRespuesta.libre();
            }
            return DisponibilidadIpRespuesta.ocupada(equipoAsignado.getCodigoInventario());
        }

        return DisponibilidadIpRespuesta.libre();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> obtenerIpVigente(Integer idCi) {
        return historialIpRepository.findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(idCi)
                .map(h -> h.getDireccionIp().getDireccion());
    }
}
