
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.Categoria;
import com.hospital.servicedesk.services.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    public ResponseEntity<List<Categoria>> getAllCategorias(@RequestParam(required = false) Boolean soloActivas) {
        return ResponseEntity.ok(categoriaService.getAllCategorias());
    }

    @PostMapping
    public ResponseEntity<Categoria> createCategoria(@RequestBody Map<String, Object> request) {
        String nombre = (String) request.get("nombre");
        Integer idPadre = request.get("idPadre") != null ? (Integer) request.get("idPadre") : null;
        Categoria categoria = categoriaService.createCategoria(nombre, idPadre);
        return new ResponseEntity<>(categoria, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categoria> updateCategoria(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        String nombre = (String) request.get("nombre");
        Integer idPadre = request.get("idPadre") != null ? (Integer) request.get("idPadre") : null;
        Categoria categoria = categoriaService.updateCategoria(id, nombre, idPadre);
        return ResponseEntity.ok(categoria);
    }
}

