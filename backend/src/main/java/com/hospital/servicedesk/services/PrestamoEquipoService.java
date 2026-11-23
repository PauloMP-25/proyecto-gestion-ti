package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.PrestamoDTOs.CrearPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.DevolverPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.PrestamoResumenDTO;

import java.util.List;

public interface PrestamoEquipoService {
    List<PrestamoResumenDTO> listarPrestamos(String estado, Integer idArea, String buscar);
    PrestamoResumenDTO getPrestamoById(Integer id);
    PrestamoResumenDTO crearPrestamo(CrearPrestamoRequest request, String usernameTecnico);
    PrestamoResumenDTO devolverPrestamo(Integer id, DevolverPrestamoRequest request);
    List<PrestamoResumenDTO> getPrestamosVencidos();
}
