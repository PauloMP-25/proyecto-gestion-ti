package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Escalamiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalamientoRepository extends JpaRepository<Escalamiento, Integer> {
    List<Escalamiento> findByTicketIdTicket(Integer idTicket);
}
