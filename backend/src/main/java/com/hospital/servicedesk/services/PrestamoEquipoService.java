package com.hospital.servicedesk.services;

import com.hospital.servicedesk.entities.PrestamoEquipo;
import java.util.List;

public interface PrestamoEquipoService {
    List<PrestamoEquipo> getAllPrestamos();
    PrestamoEquipo getPrestamoById(Integer id);
    PrestamoEquipo crearPrestamo(Integer idCi, Integer idTicket, String solicitante, String fechaDevolucionEsperada);
    PrestamoEquipo devolverPrestamo(Integer id);
}
