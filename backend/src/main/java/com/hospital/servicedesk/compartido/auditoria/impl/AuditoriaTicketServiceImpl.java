package com.hospital.servicedesk.compartido.auditoria.impl;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.entities.HistorialTicket;
import com.hospital.servicedesk.repositories.HistorialTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditoriaTicketServiceImpl implements AuditoriaTicketService {

    private final HistorialTicketRepository historialRepository;
    private final Clock clock;

    /** MANDATORY: la auditoría debe confirmarse o revertirse junto con el cambio que describe. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(RegistroAuditoriaTicket r) {
        historialRepository.save(HistorialTicket.builder()
                .ticket(r.ticket())
                .usuario(r.actor())
                .accion(r.accion())
                .estadoAnterior(r.estadoAnterior())
                .estadoNuevo(r.estadoNuevo())
                .motivo(r.motivo())
                .detalle(r.detalle())
                .ipOrigen(r.ipOrigen())
                .fechaAccion(LocalDateTime.now(clock))
                .build());
    }
}
