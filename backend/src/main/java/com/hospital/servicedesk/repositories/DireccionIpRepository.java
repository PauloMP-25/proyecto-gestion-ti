package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.DireccionIP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DireccionIpRepository extends JpaRepository<DireccionIP, Integer> {
    Optional<DireccionIP> findByDireccion(String direccion);
}
