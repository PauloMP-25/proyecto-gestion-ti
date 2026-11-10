
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.services.IndicadoresService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/indicadores")
@RequiredArgsConstructor
public class IndicadoresController {

    private final IndicadoresService indicadoresService;

    @GetMapping("/kpis")
    public ResponseEntity<Map<String, Object>> getKpis() {
        return ResponseEntity.ok(indicadoresService.getKpis());
    }

    @GetMapping("/tickets-por-area")
    public ResponseEntity<Map<String, Object>> getTicketsPorArea() {
        return ResponseEntity.ok(Map.of("Emergencia", 10, "UCI", 5, "Pediatría", 8));
    }
}

