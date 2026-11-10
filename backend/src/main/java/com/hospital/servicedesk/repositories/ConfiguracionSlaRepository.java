package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ConfiguracionSLA;
import com.hospital.servicedesk.entities.Impacto;
import com.hospital.servicedesk.entities.Urgencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionSlaRepository extends JpaRepository<ConfiguracionSLA, Integer> {
    Optional<ConfiguracionSLA> findByImpactoAndUrgencia(Impacto impacto, Urgencia urgencia);
}
