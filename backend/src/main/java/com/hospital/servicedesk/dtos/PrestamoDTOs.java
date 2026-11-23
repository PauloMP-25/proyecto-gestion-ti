package com.hospital.servicedesk.dtos;

import java.time.LocalDateTime;

public class PrestamoDTOs {

    public record PrestamoResumenDTO(
            Integer id,
            Integer idCi,
            String codigoInventario,
            String nombreEquipo,
            String tipoCi,
            String marcaModelo,
            Integer idAreaDestino,
            String nombreAreaDestino,
            Integer idTicket,
            String codigoTicket,
            String solicitante,
            String tecnicoEntrego,
            LocalDateTime fechaPrestamo,
            LocalDateTime fechaDevolucionPactada,
            LocalDateTime fechaDevolucionReal,
            String estado, // VIGENTE, VENCIDO, DEVUELTO
            String estadoDevolucion,
            String observaciones
    ) {}

    public record CrearPrestamoRequest(
            Integer idCi,
            Integer idAreaDestino,
            String solicitante,
            String fechaDevolucionPactada,
            Integer idTicket,
            String observaciones
    ) {}

    public record DevolverPrestamoRequest(
            String estadoDevolucion, // OPERATIVO, CON_DANOS, INCOMPLETO
            String observaciones
    ) {}
}
