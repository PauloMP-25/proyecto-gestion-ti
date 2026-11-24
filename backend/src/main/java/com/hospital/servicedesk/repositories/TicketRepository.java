package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.EstadoTicket;
import com.hospital.servicedesk.entities.Ticket;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    List<Ticket> findByEstado(String estado);
    List<Ticket> findByAreaIdArea(Integer idArea);

    @Query("""
            select t.idTicket from Ticket t
            where t.estado in :activos
              and t.fechaLimiteResolucion is not null
              and (t.estadoSla is null or t.estadoSla <> :vencido)
              and t.idTicket > :despuesDe
            order by t.idTicket asc
            """)
    List<Integer> idsParaMonitoreo(@Param("activos") Collection<EstadoTicket> activos,
                                   @Param("vencido") EstadoSLA vencido,
                                   @Param("despuesDe") Integer despuesDe,
                                   Pageable lote);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Ticket t set t.estadoSla = :nuevo
            where t.idTicket = :id and t.estadoSla = :anterior and t.estado in :activos
            """)
    int avanzarEstadoCompromiso(@Param("id") Integer id,
                                @Param("anterior") EstadoSLA anterior,
                                @Param("nuevo") EstadoSLA nuevo,
                                @Param("activos") Collection<EstadoTicket> activos);

    @EntityGraph(attributePaths = {"area", "tecnicoAsignado"})
    Optional<Ticket> findConAreaYTecnicoByIdTicket(Integer idTicket);
}
