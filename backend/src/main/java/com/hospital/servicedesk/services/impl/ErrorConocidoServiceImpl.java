package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.dtos.ErrorConocidoDTOs.*;
import com.hospital.servicedesk.entities.ErrorConocido;
import com.hospital.servicedesk.repositories.ErrorConocidoRepository;
import com.hospital.servicedesk.services.ErrorConocidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ErrorConocidoServiceImpl implements ErrorConocidoService {

    private final ErrorConocidoRepository repo;

    @Override
    public List<ErrorConocidoResponse> getAllErrors() {
        return repo.findAll().stream().map(this::map).collect(Collectors.toList());
    }

    @Override
    public ErrorConocidoResponse getErrorById(Integer id) {
        return map(findOrThrow(id));
    }

    @Override
    @Transactional
    public ErrorConocidoResponse createError(ErrorConocidoRequest req) {
        ErrorConocido error = ErrorConocido.builder()
                .titulo(req.getTitulo())
                .descripcionProblema(req.getDescripcionProblema())
                .solucionTrabajo(req.getSolucionTrabajo())
                .publicado(req.getPublicado() != null ? req.getPublicado() : true)
                .build();
        return map(repo.save(error));
    }

    @Override
    @Transactional
    public ErrorConocidoResponse updateError(Integer id, ErrorConocidoRequest req) {
        ErrorConocido error = findOrThrow(id);
        error.setTitulo(req.getTitulo());
        error.setDescripcionProblema(req.getDescripcionProblema());
        error.setSolucionTrabajo(req.getSolucionTrabajo());
        if (req.getPublicado() != null) error.setPublicado(req.getPublicado());
        return map(repo.save(error));
    }

    @Override
    @Transactional
    public void deleteError(Integer id) {
        ErrorConocido error = findOrThrow(id);
        repo.delete(error);
    }

    private ErrorConocido findOrThrow(Integer id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Error conocido no encontrado"));
    }

    private ErrorConocidoResponse map(ErrorConocido e) {
        return ErrorConocidoResponse.builder()
                .idError(e.getIdError())
                .titulo(e.getTitulo())
                .descripcionProblema(e.getDescripcionProblema())
                .solucionTrabajo(e.getSolucionTrabajo())
                .publicado(e.getPublicado())
                .fechaCreacion(e.getFechaCreacion())
                .build();
    }
}
