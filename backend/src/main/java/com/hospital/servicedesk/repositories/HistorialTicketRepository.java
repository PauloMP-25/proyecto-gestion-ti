package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.HistorialTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialTicketRepository extends JpaRepository<HistorialTicket, Integer> {
    List<HistorialTicket> findByTicketIdTicket(Integer idTicket);
}
