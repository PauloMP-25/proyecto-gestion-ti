package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.Area;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AreaRepository extends JpaRepository<Area, Integer> {
    boolean existsByNombreIgnoreCase(String nombre);
    Optional<Area> findByNombreIgnoreCase(String nombre);
}