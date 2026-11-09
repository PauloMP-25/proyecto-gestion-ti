package com.hospital.servicedesk.services;

import com.hospital.servicedesk.dtos.ErrorConocidoDTOs.*;
import java.util.List;

public interface ErrorConocidoService {
    List<ErrorConocidoResponse> getAllErrors();
    ErrorConocidoResponse getErrorById(Integer id);
    ErrorConocidoResponse createError(ErrorConocidoRequest request);
    ErrorConocidoResponse updateError(Integer id, ErrorConocidoRequest request);
    void deleteError(Integer id);
}
