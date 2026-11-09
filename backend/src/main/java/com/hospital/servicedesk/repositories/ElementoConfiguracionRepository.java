package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElementoConfiguracionRepository extends JpaRepository<ElementoConfiguracion, Integer> {
    List<ElementoConfiguracion> findByAreaIdArea(Integer idArea);
}
