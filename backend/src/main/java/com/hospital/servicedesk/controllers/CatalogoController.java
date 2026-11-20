package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.dtos.OpcionCatalogoRespuesta;
import com.hospital.servicedesk.services.CatalogoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalogos")
@RequiredArgsConstructor
public class CatalogoController {

    private final CatalogoService catalogoService;

    @GetMapping("/grados-profesionales")
    public ResponseEntity<List<OpcionCatalogoRespuesta>> getGradosProfesionales() {
        return ResponseEntity.ok(catalogoService.getGradosProfesionales());
    }
}
