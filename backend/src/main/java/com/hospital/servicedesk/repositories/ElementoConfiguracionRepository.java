package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElementoConfiguracionRepository extends JpaRepository<ElementoConfiguracion, Integer> {
    List<ElementoConfiguracion> findByAreaIdArea(Integer idArea);
    List<ElementoConfiguracion> findByAreaIdAreaAndTipoCi(Integer idArea, TipoCI tipoCi);
    List<ElementoConfiguracion> findByAreaIdAreaAndEstado(Integer idArea, EstadoCI estado);
    List<ElementoConfiguracion> findByAreaIdAreaAndTipoCiAndEstado(Integer idArea, TipoCI tipoCi, EstadoCI estado);
    Optional<ElementoConfiguracion> findByCodigoInventarioIgnoreCase(String codigoInventario);
    boolean existsByCodigoInventarioIgnoreCase(String codigoInventario);
    long countByArea_IdAreaAndTipoCiAndEstado(Integer idArea, TipoCI tipoCi, EstadoCI estado);
    long countByArea_IdAreaAndEstado(Integer idArea, EstadoCI estado);
    Page<ElementoConfiguracion> findByArea_IdArea(Integer idArea, Pageable pageable);
}
