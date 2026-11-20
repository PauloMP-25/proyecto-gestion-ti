package com.hospital.servicedesk.administrativo.equipos.aplicacion;

import com.hospital.servicedesk.administrativo.equipos.dto.CodigoSugeridoRespuesta;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import org.springframework.data.domain.Pageable;

/**
 * Puerto de lectura y consulta de inventario de equipos hospitalarios.
 */
public interface EquipoConsultaService {

    PaginaRespuesta<EquipoResumen> listar(
            Integer idArea,
            TipoCI tipo,
            EstadoCI estado,
            Boolean sinIp,
            String buscar,
            Pageable pageable
    );

    EquipoDetalle obtener(Integer id);

    CodigoSugeridoRespuesta sugerirCodigo(TipoCI tipo, Integer idArea);
}
