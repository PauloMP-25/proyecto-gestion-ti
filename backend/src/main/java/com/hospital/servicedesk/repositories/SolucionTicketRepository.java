package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.SolucionTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SolucionTicketRepository extends JpaRepository<SolucionTicket, Integer> {
    Optional<SolucionTicket> findByTicket_IdTicket(Integer idTicket);
}
