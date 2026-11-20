package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistorialAsignacionIpRepository extends JpaRepository<HistorialAsignacionIP, Integer> {

    @Query("SELECT h FROM HistorialAsignacionIP h WHERE h.direccionIp.direccion = :direccion AND h.fechaLiberacion IS NULL")
    Optional<HistorialAsignacionIP> findActiveAssignmentByIp(@Param("direccion") String direccion);

    Optional<HistorialAsignacionIP> findFirstByElementoConfiguracion_IdCiAndFechaLiberacionIsNull(Integer idCi);

    List<HistorialAsignacionIP> findByElementoConfiguracion_IdCiOrderByFechaAsignacionDesc(Integer idCi);

    boolean existsByDireccionIp_DireccionAndFechaLiberacionIsNull(String direccion);

    Optional<HistorialAsignacionIP> findFirstByDireccionIp_DireccionAndFechaLiberacionIsNull(String direccion);
}
