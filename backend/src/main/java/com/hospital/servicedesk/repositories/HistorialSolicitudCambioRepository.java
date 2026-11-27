package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.HistorialSolicitudCambio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialSolicitudCambioRepository extends JpaRepository<HistorialSolicitudCambio, Integer> {

    @EntityGraph(attributePaths = "usuario")
    List<HistorialSolicitudCambio> findBySolicitud_IdOrderByFechaAscIdAsc(Integer idSolicitud);

    void deleteBySolicitud_Id(Integer idSolicitud);
}
