package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.PrestamoDTOs.CrearPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.DevolverPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.PrestamoResumenDTO;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.repositories.*;
import com.hospital.servicedesk.services.PrestamoEquipoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrestamoEquipoServiceImpl implements PrestamoEquipoService {

    private final PrestamoEquipoRepository prestamoRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final UsuarioRepository usuarioRepo;
    private final AreaRepository areaRepo;
    private final TicketRepository ticketRepo;

    @Override
    @Transactional(readOnly = true)
    public List<PrestamoResumenDTO> listarPrestamos(String estado, Integer idArea, String buscar) {
        List<PrestamoEquipo> prestamos = prestamoRepo.findAllConRelaciones();

        LocalDateTime ahora = LocalDateTime.now();

        return prestamos.stream()
                .filter(p -> {
                    String estCalculado = calcularEstado(p, ahora);
                    if (estado != null && !estado.isBlank() && !estado.equalsIgnoreCase("TODOS")) {
                        if (!estCalculado.equalsIgnoreCase(estado)) return false;
                    }
                    if (idArea != null && p.getAreaDestino() != null) {
                        if (!p.getAreaDestino().getIdArea().equals(idArea)) return false;
                    }
                    if (buscar != null && !buscar.isBlank()) {
                        String b = buscar.toLowerCase().trim();
                        boolean matchEquipo = p.getElementoConfiguracion() != null
                                && (p.getElementoConfiguracion().getNombre().toLowerCase().contains(b)
                                || p.getElementoConfiguracion().getCodigoInventario().toLowerCase().contains(b));
                        boolean matchSolicitante = p.getSolicitante() != null
                                && p.getSolicitante().toLowerCase().contains(b);
                        boolean matchArea = p.getAreaDestino() != null
                                && p.getAreaDestino().getNombre().toLowerCase().contains(b);
                        return matchEquipo || matchSolicitante || matchArea;
                    }
                    return true;
                })
                .map(p -> mapearAResumen(p, ahora))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PrestamoResumenDTO getPrestamoById(Integer id) {
        PrestamoEquipo p = prestamoRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Préstamo de equipo no encontrado con id: " + id));
        return mapearAResumen(p, LocalDateTime.now());
    }

    @Override
    @Transactional
    public PrestamoResumenDTO crearPrestamo(CrearPrestamoRequest req, String usernameTecnico) {
        if (req.idCi() == null) {
            throw new ReglaNegocioException("idCi", "Debe seleccionar un equipo para el préstamo.");
        }

        ElementoConfiguracion ci = ciRepo.findById(req.idCi())
                .orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado con id: " + req.idCi()));

        if (prestamoRepo.existsByElementoConfiguracion_IdCiAndFechaDevolucionIsNull(req.idCi())) {
            throw new ConflictoNegocioException("idCi", "El equipo «" + ci.getCodigoInventario() + "» ya cuenta con un préstamo activo vigente.");
        }

        Area areaDestino = null;
        if (req.idAreaDestino() != null) {
            areaDestino = areaRepo.findById(req.idAreaDestino())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Área destino no encontrada con id: " + req.idAreaDestino()));
        }

        Ticket ticket = null;
        if (req.idTicket() != null) {
            ticket = ticketRepo.findById(req.idTicket()).orElse(null);
        }

        Usuario tecnico = usuarioRepo.findByNombreUsuario(usernameTecnico)
                .orElseGet(() -> usuarioRepo.findAll().stream().findFirst().orElse(null));

        LocalDateTime fechaPactada = null;
        if (req.fechaDevolucionPactada() != null && !req.fechaDevolucionPactada().isBlank()) {
            try {
                fechaPactada = LocalDateTime.parse(req.fechaDevolucionPactada().replace("Z", ""), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception e) {
                fechaPactada = LocalDateTime.now().plusDays(7);
            }
        } else {
            fechaPactada = LocalDateTime.now().plusDays(7);
        }

        PrestamoEquipo nuevo = PrestamoEquipo.builder()
                .elementoConfiguracion(ci)
                .areaDestino(areaDestino)
                .ticket(ticket)
                .usuarioTecnico(tecnico)
                .solicitante(req.solicitante() != null && !req.solicitante().isBlank() ? req.solicitante().trim() : "Personal Asistencial")
                .fechaPrestamo(LocalDateTime.now())
                .fechaDevolucionPactada(fechaPactada)
                .observaciones(req.observaciones())
                .build();

        PrestamoEquipo guardado = prestamoRepo.save(nuevo);
        log.info("Préstamo registrado exitosamente [ID: {}] | Equipo: {} ({}) | Área destino: {} | Solicitante: {} | Técnico responsable: {}",
                guardado.getIdPrestamo(), ci.getCodigoInventario(), ci.getNombre(),
                areaDestino != null ? areaDestino.getNombre() : "NO ASIGNADA",
                guardado.getSolicitante(), tecnico != null ? tecnico.getNombreUsuario() : "SISTEMA");

        return mapearAResumen(guardado, LocalDateTime.now());
    }

    @Override
    @Transactional
    public PrestamoResumenDTO devolverPrestamo(Integer id, DevolverPrestamoRequest req) {
        PrestamoEquipo p = prestamoRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Préstamo no encontrado con id: " + id));

        if (p.getFechaDevolucion() != null) {
            log.warn("Intento de doble devolución para préstamo con id: {}", id);
            throw new ReglaNegocioException("fechaDevolucion", "Este préstamo ya fue devuelto con anterioridad.");
        }

        p.setFechaDevolucion(LocalDateTime.now());
        if (req != null) {
            p.setEstadoDevolucion(req.estadoDevolucion() != null ? req.estadoDevolucion() : "OPERATIVO");
            if (req.observaciones() != null && !req.observaciones().isBlank()) {
                String notasPrevias = p.getObservaciones() != null ? p.getObservaciones() + " | " : "";
                p.setObservaciones(notasPrevias + "Devolución: " + req.observaciones().trim());
            }
        } else {
            p.setEstadoDevolucion("OPERATIVO");
        }

        PrestamoEquipo actualizado = prestamoRepo.save(p);
        log.info("Devolución de préstamo registrada [ID: {}] | Equipo: {} | Estado recibido: {}",
                actualizado.getIdPrestamo(),
                p.getElementoConfiguracion() != null ? p.getElementoConfiguracion().getCodigoInventario() : "—",
                actualizado.getEstadoDevolucion());

        return mapearAResumen(actualizado, LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PrestamoResumenDTO> getPrestamosVencidos() {
        return listarPrestamos("VENCIDO", null, null);
    }

    private String calcularEstado(PrestamoEquipo p, LocalDateTime ahora) {
        if (p.getFechaDevolucion() != null) {
            return "DEVUELTO";
        }
        if (p.getFechaDevolucionPactada() != null && p.getFechaDevolucionPactada().isBefore(ahora)) {
            return "VENCIDO";
        }
        return "VIGENTE";
    }

    private PrestamoResumenDTO mapearAResumen(PrestamoEquipo p, LocalDateTime ahora) {
        ElementoConfiguracion ci = p.getElementoConfiguracion();
        Area area = p.getAreaDestino();
        Ticket ticket = p.getTicket();
        Usuario tec = p.getUsuarioTecnico();

        return new PrestamoResumenDTO(
                p.getIdPrestamo(),
                ci != null ? ci.getIdCi() : null,
                ci != null ? ci.getCodigoInventario() : "—",
                ci != null ? ci.getNombre() : "Equipo sin nombre",
                ci != null && ci.getTipoCi() != null ? ci.getTipoCi().name() : "EQUIPO",
                ci != null ? ci.getMarcaModelo() : null,
                area != null ? area.getIdArea() : null,
                area != null ? area.getNombre() : "Área no especificada",
                ticket != null ? ticket.getIdTicket() : null,
                ticket != null ? "INC-" + ticket.getIdTicket() : null,
                p.getSolicitante() != null ? p.getSolicitante() : "Personal Asistencial",
                tec != null ? tec.getNombreVisible() : "Mesa de Ayuda",
                p.getFechaPrestamo(),
                p.getFechaDevolucionPactada(),
                p.getFechaDevolucion(),
                calcularEstado(p, ahora),
                p.getEstadoDevolucion(),
                p.getObservaciones()
        );
    }
}
