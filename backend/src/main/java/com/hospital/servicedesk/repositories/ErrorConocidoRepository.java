package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ErrorConocidoRepository extends JpaRepository<ErrorConocido, Integer>,
        JpaSpecificationExecutor<ErrorConocido> {

    List<ErrorConocido> findByPublicadoTrue();

    @Modifying
    @Query("update ErrorConocido e set e.conteoVisitas = e.conteoVisitas + 1 where e.idError = :id")
    int incrementarVisitas(@Param("id") Integer id);

    @Query("""
            select e.categoria, count(e) from ErrorConocido e
            where e.publicado = true and (:soloPublicas = false or e.ambito = :publico)
            group by e.categoria
            """)
    List<Object[]> contarPorCategoria(@Param("soloPublicas") boolean soloPublicas,
                                      @Param("publico") AmbitoGuia publico);
}
