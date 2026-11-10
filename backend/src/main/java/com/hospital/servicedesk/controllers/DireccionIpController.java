
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.DireccionIP;
import com.hospital.servicedesk.entities.HistorialAsignacionIP;
import com.hospital.servicedesk.services.DireccionIpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/direcciones-ip")
@RequiredArgsConstructor
public class DireccionIpController {

    private final DireccionIpService ipService;

    @GetMapping
    public ResponseEntity<List<DireccionIP>> getAllDireccionesIp() {
        return ResponseEntity.ok(ipService.getAllDireccionesIp());
    }

    @PostMapping
    public ResponseEntity<DireccionIP> createDireccionIp(@RequestBody Map<String, Object> request) {
        DireccionIP ip = ipService.createDireccionIp(request);
        return new ResponseEntity<>(ip, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/asignar")
    public ResponseEntity<HistorialAsignacionIP> asignarIp(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        HistorialAsignacionIP historial = ipService.asignarIp(id, request);
        return new ResponseEntity<>(historial, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/liberar")
    public ResponseEntity<HistorialAsignacionIP> liberarIp(@PathVariable Integer id) {
        HistorialAsignacionIP historial = ipService.liberarIp(id);
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<List<HistorialAsignacionIP>> getHistorialIp(@PathVariable Integer id) {
        return ResponseEntity.ok(ipService.getHistorialIp(id));
    }
}

