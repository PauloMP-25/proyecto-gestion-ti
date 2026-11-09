package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    List<Ticket> findByEstado(String estado);
    List<Ticket> findByAreaIdArea(Integer idArea);
}
