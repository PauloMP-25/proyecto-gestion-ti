package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ErrorConocido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ErrorConocidoRepository extends JpaRepository<ErrorConocido, Integer> {
    List<ErrorConocido> findByPublicadoTrue();
}
