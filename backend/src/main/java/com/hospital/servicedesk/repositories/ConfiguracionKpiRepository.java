package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ConfiguracionKPI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionKpiRepository extends JpaRepository<ConfiguracionKPI, Integer> {
    List<ConfiguracionKPI> findByActivoTrue();
    List<ConfiguracionKPI> findByActivoTrueOrderByOrdenAsc();
    List<ConfiguracionKPI> findAllByOrderByOrdenAsc();
    Optional<ConfiguracionKPI> findByCodigo(String codigo);
}
