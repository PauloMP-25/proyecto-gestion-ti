package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.PrestamoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestamoEquipoRepository extends JpaRepository<PrestamoEquipo, Integer> {
    List<PrestamoEquipo> findByEstado(String estado);
    List<PrestamoEquipo> findByElementoConfiguracion_Area_IdArea(Integer idArea);
}
