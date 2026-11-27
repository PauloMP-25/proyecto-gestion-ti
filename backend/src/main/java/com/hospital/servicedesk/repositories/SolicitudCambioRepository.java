package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SolicitudCambioRepository extends JpaRepository<SolicitudCambio, Integer> {

    @Query("""
            select s from SolicitudCambio s
            where (:estado is null or s.estado = :estado)
              and (:impacto is null or s.impacto = :impacto)
              and (:tipo is null or s.tipo = :tipo)
              and (:texto is null or s.textoBusqueda like concat('%', :texto, '%'))
            order by s.fechaRegistro desc
            """)
    @EntityGraph(attributePaths = {"solicitante", "areasAfectadas"})
    List<SolicitudCambio> buscar(@Param("estado") EstadoCambio estado,
                                 @Param("impacto") ImpactoAsistencial impacto,
                                 @Param("tipo") TipoCambio tipo,
                                 @Param("texto") String textoNormalizado);

    @EntityGraph(attributePaths = {"solicitante", "aprobador", "areasAfectadas", "ticketOrigen", "pasosImplementacion", "pasosReversa"})
    Optional<SolicitudCambio> findDetalleById(Integer id);
}
