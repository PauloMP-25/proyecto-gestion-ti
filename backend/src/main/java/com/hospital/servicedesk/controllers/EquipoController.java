
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.ElementoConfiguracion;
import com.hospital.servicedesk.services.EquipoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipos")
@RequiredArgsConstructor
public class EquipoController {

    private final EquipoService equipoService;

    @GetMapping
    public ResponseEntity<List<ElementoConfiguracion>> getAllEquipos() {
        return ResponseEntity.ok(equipoService.getAllEquipos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElementoConfiguracion> getEquipoById(@PathVariable Integer id) {
        return ResponseEntity.ok(equipoService.getEquipoById(id));
    }

    @PostMapping
    public ResponseEntity<ElementoConfiguracion> createEquipo(@RequestBody Map<String, Object> request) {
        ElementoConfiguracion ci = equipoService.createEquipo(request);
        return new ResponseEntity<>(ci, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ElementoConfiguracion> updateEquipo(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        ElementoConfiguracion ci = equipoService.updateEquipo(id, request);
        return ResponseEntity.ok(ci);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ElementoConfiguracion> updateEstado(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        ElementoConfiguracion ci = equipoService.updateEstado(id, request.get("estado"));
        return ResponseEntity.ok(ci);
    }
}

