
package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.services.AreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreaController {

    private final AreaService areaService;

    @GetMapping
    public ResponseEntity<List<Area>> getAllAreas() {
        return ResponseEntity.ok(areaService.getAllAreas());
    }

    @PostMapping
    public ResponseEntity<Area> createArea(@RequestBody Map<String, String> request) {
        Area area = areaService.createArea(request.get("nombre"), request.get("anexo"));
        return new ResponseEntity<>(area, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Area> updateArea(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        Area area = areaService.updateArea(id, request.get("nombre"), request.get("anexo"));
        return ResponseEntity.ok(area);
    }
}

