package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.EstadoTicket;
import com.hospital.servicedesk.repositories.TicketRepository;
import com.hospital.servicedesk.services.IndicadoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class IndicadoresServiceImpl implements IndicadoresService {

    private final TicketRepository ticketRepo;

    @Override
    public Map<String, Object> getKpis() {
        long totalTickets = ticketRepo.count();
        long abiertos = ticketRepo.findAll().stream().filter(t -> EstadoTicket.ABIERTO.equals(t.getEstado())).count();
        long resueltos = ticketRepo.findAll().stream().filter(t -> EstadoTicket.RESUELTO.equals(t.getEstado())).count();
        long dentroSla = ticketRepo.findAll().stream().filter(t -> EstadoSLA.DENTRO_TIEMPO.equals(t.getEstadoSla())).count();

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalTickets", totalTickets);
        kpis.put("abiertos", abiertos);
        kpis.put("resueltos", resueltos);
        kpis.put("cumplimientoSlaPorcentaje", totalTickets > 0 ? (double) dentroSla / totalTickets * 100.0 : 100.0);
        return kpis;
    }
}
