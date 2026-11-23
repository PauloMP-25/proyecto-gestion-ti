package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.PrestamoDTOs.CrearPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.DevolverPrestamoRequest;
import com.hospital.servicedesk.dtos.PrestamoDTOs.PrestamoResumenDTO;
import com.hospital.servicedesk.services.PrestamoEquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PRACTICANTE', 'ADMINISTRADOR')")
public class PrestamoEquipoController {

    private final PrestamoEquipoService prestamoService;

    @GetMapping
    public ResponseEntity<List<PrestamoResumenDTO>> listarPrestamos(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Integer areaId,
            @RequestParam(required = false) String buscar
    ) {
        return ResponseEntity.ok(prestamoService.listarPrestamos(estado, areaId, buscar));
    }

    @GetMapping("/vencidos")
    public ResponseEntity<List<PrestamoResumenDTO>> getPrestamosVencidos() {
        return ResponseEntity.ok(prestamoService.getPrestamosVencidos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoResumenDTO> getPrestamoById(@PathVariable Integer id) {
        return ResponseEntity.ok(prestamoService.getPrestamoById(id));
    }

    @PostMapping
    public ResponseEntity<PrestamoResumenDTO> crearPrestamo(
            @RequestBody CrearPrestamoRequest request,
            Authentication auth
    ) {
        String username = auth != null ? auth.getName() : "admin";
        PrestamoResumenDTO creado = prestamoService.crearPrestamo(request, username);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/devolver")
    public ResponseEntity<PrestamoResumenDTO> devolverPrestamoPost(
            @PathVariable Integer id,
            @RequestBody(required = false) DevolverPrestamoRequest request
    ) {
        return ResponseEntity.ok(prestamoService.devolverPrestamo(id, request));
    }

    @PutMapping("/{id}/devolver")
    public ResponseEntity<PrestamoResumenDTO> devolverPrestamoPut(
            @PathVariable Integer id,
            @RequestBody(required = false) DevolverPrestamoRequest request
    ) {
        return ResponseEntity.ok(prestamoService.devolverPrestamo(id, request));
    }
}
