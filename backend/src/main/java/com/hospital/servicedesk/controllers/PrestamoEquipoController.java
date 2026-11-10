
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.PrestamoEquipo;
import com.hospital.servicedesk.services.PrestamoEquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prestamos")
@RequiredArgsConstructor
public class PrestamoEquipoController {

    private final PrestamoEquipoService prestamoService;

    @GetMapping
    public ResponseEntity<List<PrestamoEquipo>> getAllPrestamos() {
        return ResponseEntity.ok(prestamoService.getAllPrestamos());
    }

    @GetMapping("/vencidos")
    public ResponseEntity<List<PrestamoEquipo>> getPrestamosVencidos() {
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoEquipo> getPrestamoById(@PathVariable Integer id) {
        return ResponseEntity.ok(prestamoService.getPrestamoById(id));
    }

    @PostMapping
    public ResponseEntity<PrestamoEquipo> crearPrestamo(@RequestBody Map<String, Object> request) {
        Integer idCi = (Integer) request.get("idCi");
        Integer idTicket = request.get("idTicket") != null ? (Integer) request.get("idTicket") : null;
        String solicitante = (String) request.get("solicitante");
        String fechaDevolucion = (String) request.get("fechaDevolucionEsperada");

        PrestamoEquipo prestamo = prestamoService.crearPrestamo(idCi, idTicket, solicitante, fechaDevolucion);
        return new ResponseEntity<>(prestamo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/devolver")
    public ResponseEntity<PrestamoEquipo> devolverPrestamo(@PathVariable Integer id) {
        return ResponseEntity.ok(prestamoService.devolverPrestamo(id));
    }
}

