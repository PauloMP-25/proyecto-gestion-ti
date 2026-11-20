package com.hospital.servicedesk.administrativo.equipos.api;

import com.hospital.servicedesk.administrativo.equipos.aplicacion.AsignacionIpService;
import com.hospital.servicedesk.administrativo.equipos.dto.DisponibilidadIpRespuesta;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de administración hospitalaria para la verificación y gestión de red IP.
 */
@RestController
@RequestMapping("/api/admin/red")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class RedAdminController {

    private final AsignacionIpService asignacionIpService;

    public RedAdminController(AsignacionIpService asignacionIpService) {
        this.asignacionIpService = asignacionIpService;
    }

    @GetMapping("/ip-disponibilidad")
    public ResponseEntity<DisponibilidadIpRespuesta> verificarDisponibilidad(
            @RequestParam String ip,
            @RequestParam(required = false) Integer idEquipo
    ) {
        return ResponseEntity.ok(asignacionIpService.verificarDisponibilidad(ip, idEquipo));
    }
}
