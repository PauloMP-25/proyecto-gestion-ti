package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.TipoCI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElementoConfiguracionRepository extends JpaRepository<ElementoConfiguracion, Integer> {
    List<ElementoConfiguracion> findByAreaIdArea(Integer idArea);
    List<ElementoConfiguracion> findByAreaIdAreaAndTipoCi(Integer idArea, TipoCI tipoCi);
    Optional<ElementoConfiguracion> findByCodigoInventarioIgnoreCase(String codigoInventario);
    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);
}
