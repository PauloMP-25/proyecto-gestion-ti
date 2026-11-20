package com.hospital.servicedesk.administrativo.areas.api;

import com.hospital.servicedesk.administrativo.areas.aplicacion.AreaConsultaService;
import com.hospital.servicedesk.administrativo.areas.aplicacion.AreaGestionService;
import com.hospital.servicedesk.administrativo.areas.dto.AreaDetalle;
import com.hospital.servicedesk.administrativo.areas.dto.AreaResumen;
import com.hospital.servicedesk.administrativo.areas.dto.AreaSolicitud;
import com.hospital.servicedesk.administrativo.areas.dto.CambioEstadoSolicitud;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.compartido.web.RespuestaConAdvertencias;
import com.hospital.servicedesk.dtos.UsuarioDTOs.UsuarioResumen;
import com.hospital.servicedesk.entities.TipoCI;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Controlador de administración hospitalaria para áreas y servicios.
 * Solo accesible para el rol ADMINISTRADOR.
 */
@RestController
@RequestMapping("/api/admin/areas")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AreaAdminController {

    private final AreaConsultaService consultaService;
    private final AreaGestionService gestionService;

    public AreaAdminController(AreaConsultaService consultaService, AreaGestionService gestionService) {
        this.consultaService = consultaService;
        this.gestionService = gestionService;
    }

    @GetMapping
    public ResponseEntity<List<AreaResumen>> listar(
            @RequestParam(required = false) String buscar,
            @RequestParam(defaultValue = "false") boolean incluirInactivas
    ) {
        return ResponseEntity.ok(consultaService.listar(buscar, incluirInactivas));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AreaDetalle> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(consultaService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<AreaDetalle> crear(@Valid @RequestBody AreaSolicitud solicitud) {
        AreaDetalle creado = gestionService.crear(solicitud);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creado.id())
                .toUri();
        return ResponseEntity.created(location).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RespuestaConAdvertencias<AreaDetalle>> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody AreaSolicitud solicitud
    ) {
        return ResponseEntity.ok(gestionService.actualizar(id, solicitud));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<AreaDetalle> cambiarEstado(
            @PathVariable Integer id,
            @Valid @RequestBody CambioEstadoSolicitud solicitud
    ) {
        return ResponseEntity.ok(gestionService.cambiarEstado(id, solicitud.activo()));
    }

    @GetMapping("/{id}/personal")
    public ResponseEntity<List<UsuarioResumen>> listarPersonal(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "false") boolean incluirInactivos
    ) {
        return ResponseEntity.ok(gestionService.listarPersonal(id, incluirInactivos));
    }

    @PostMapping("/{id}/personal")
    public ResponseEntity<UsuarioResumen> reasignarPersonal(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> body
    ) {
        Integer idUsuario = body != null ? body.get("idUsuario") : null;
        if (idUsuario == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(gestionService.reasignarPersonal(id, idUsuario));
    }

    @GetMapping("/{id}/equipos")
    public ResponseEntity<List<EquipoResumen>> listarEquipos(
            @PathVariable Integer id,
            @RequestParam(required = false) TipoCI tipo
    ) {
        return ResponseEntity.ok(gestionService.listarEquipos(id, tipo));
    }
}
