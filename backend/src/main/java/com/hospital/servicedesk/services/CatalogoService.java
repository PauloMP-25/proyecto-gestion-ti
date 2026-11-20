package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.OpcionCatalogoRespuesta;

import java.util.List;

/**
 * Contrato de servicio para consulta de catálogos del sistema hospitalario.
 */
public interface CatalogoService {

    /**
     * Retorna la lista ordenada de grados y títulos profesionales disponibles para el personal.
     */
    List<OpcionCatalogoRespuesta> getGradosProfesionales();
}
