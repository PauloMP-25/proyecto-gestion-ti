package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.CorrelativoDocumento;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CorrelativoDocumentoRepository extends JpaRepository<CorrelativoDocumento, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CorrelativoDocumento c where c.clave = :clave")
    Optional<CorrelativoDocumento> bloquear(@Param("clave") String clave);
}
