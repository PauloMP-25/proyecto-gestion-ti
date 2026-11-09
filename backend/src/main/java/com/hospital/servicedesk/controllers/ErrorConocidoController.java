package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.ErrorConocidoDTOs.*;
import com.hospital.servicedesk.services.ErrorConocidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kedb")
@RequiredArgsConstructor
public class ErrorConocidoController {

    private final ErrorConocidoService service;

    @GetMapping
    public ResponseEntity<List<ErrorConocidoResponse>> getAllErrors() {
        return ResponseEntity.ok(service.getAllErrors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ErrorConocidoResponse> getErrorById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getErrorById(id));
    }

    @PostMapping
    public ResponseEntity<ErrorConocidoResponse> createError(@Valid @RequestBody ErrorConocidoRequest request) {
        return new ResponseEntity<>(service.createError(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ErrorConocidoResponse> updateError(@PathVariable Integer id, @Valid @RequestBody ErrorConocidoRequest request) {
        return ResponseEntity.ok(service.updateError(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteError(@PathVariable Integer id) {
        service.deleteError(id);
        return ResponseEntity.noContent().build();
    }
}
