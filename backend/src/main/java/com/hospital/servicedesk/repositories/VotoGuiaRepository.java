package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.VotoGuia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VotoGuiaRepository extends JpaRepository<VotoGuia, Integer> {
    Optional<VotoGuia> findByGuia_IdErrorAndUsuario_IdUsuario(Integer idGuia, Integer idUsuario);
    long countByGuia_IdErrorAndEsUtil(Integer idGuia, boolean esUtil);
}
