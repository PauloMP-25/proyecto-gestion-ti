package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.PrestamoEquipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestamoEquipoRepository extends JpaRepository<PrestamoEquipo, Integer> {

    @Query("SELECT p FROM PrestamoEquipo p LEFT JOIN FETCH p.elementoConfiguracion LEFT JOIN FETCH p.areaDestino LEFT JOIN FETCH p.ticket LEFT JOIN FETCH p.usuarioTecnico ORDER BY p.fechaPrestamo DESC")
    List<PrestamoEquipo> findAllConRelaciones();

    boolean existsByElementoConfiguracion_IdCiAndFechaDevolucionIsNull(Integer idCi);

    List<PrestamoEquipo> findByFechaDevolucionIsNull();
}
