package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.ErrorConocidoDTOs.*;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import java.util.List;

public interface ErrorConocidoService {
    List<ErrorConocidoResponse> getAllErrors();
    PaginaRespuesta<ErrorConocidoResponse> getErrorsPaginados(int pagina, int tamano, String texto);
    ErrorConocidoResponse getErrorById(Integer id);
    ErrorConocidoResponse createError(ErrorConocidoRequest request);
    ErrorConocidoResponse updateError(Integer id, ErrorConocidoRequest request);
    void deleteError(Integer id);
}
