package com.hospital.servicedesk.administrativo.equipos.api;

import com.hospital.servicedesk.administrativo.equipos.aplicacion.EquipoConsultaService;
import com.hospital.servicedesk.administrativo.equipos.aplicacion.EquipoGestionService;
import com.hospital.servicedesk.administrativo.equipos.dto.AsignarIpSolicitud;
import com.hospital.servicedesk.administrativo.equipos.dto.CodigoSugeridoRespuesta;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoDetalle;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoResumen;
import com.hospital.servicedesk.administrativo.equipos.dto.EquipoSolicitud;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.EstadoCI;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Map;

/**
 * Controlador de administración hospitalaria para equipos de cómputo e infraestructura.
 * Restringido exclusivamente al rol ADMINISTRADOR.
 */
@RestController
@RequestMapping("/api/admin/equipos")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class EquipoAdminController {

    private final EquipoConsultaService consultaService;
    private final EquipoGestionService gestionService;
    private final UsuarioRepository usuarioRepository;

    public EquipoAdminController(
            EquipoConsultaService consultaService,
            EquipoGestionService gestionService,
            UsuarioRepository usuarioRepository
    ) {
        this.consultaService = consultaService;
        this.gestionService = gestionService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<PaginaRespuesta<EquipoResumen>> listar(
            @RequestParam(required = false) Integer idArea,
            @RequestParam(required = false) TipoCI tipo,
            @RequestParam(required = false) EstadoCI estado,
            @RequestParam(required = false) Boolean sinIp,
            @RequestParam(required = false) String buscar,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        PageRequest pageable = PageRequest.of(pagina, tamano, Sort.by("codigoInventario").ascending());
        return ResponseEntity.ok(consultaService.listar(idArea, tipo, estado, sinIp, buscar, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoDetalle> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(consultaService.obtener(id));
    }

    @GetMapping("/sugerir-codigo")
    public ResponseEntity<CodigoSugeridoRespuesta> sugerirCodigo(
            @RequestParam TipoCI tipo,
            @RequestParam Integer idArea
    ) {
        return ResponseEntity.ok(consultaService.sugerirCodigo(tipo, idArea));
    }

    @PostMapping
    public ResponseEntity<EquipoDetalle> crear(
            @Valid @RequestBody EquipoSolicitud solicitud,
            Authentication authentication
    ) {
        Usuario operador = resolverUsuarioOperador(authentication);
        EquipoDetalle creado = gestionService.crear(solicitud, operador);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creado.id())
                .toUri();
        return ResponseEntity.created(location).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoDetalle> actualizar(
            @PathVariable Integer id,
            @Valid @RequestBody EquipoSolicitud solicitud,
            Authentication authentication
    ) {
        Usuario operador = resolverUsuarioOperador(authentication);
        return ResponseEntity.ok(gestionService.actualizar(id, solicitud, operador));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<EquipoDetalle> cambiarEstado(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String estadoStr = body != null ? body.get("estado") : null;
        if (estadoStr == null || estadoStr.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        EstadoCI nuevoEstado = EstadoCI.valueOf(estadoStr.trim().toUpperCase());
        Usuario operador = resolverUsuarioOperador(authentication);
        return ResponseEntity.ok(gestionService.cambiarEstado(id, nuevoEstado, operador));
    }

    @PostMapping("/{id}/ip")
    public ResponseEntity<EquipoDetalle> asignarIp(
            @PathVariable Integer id,
            @Valid @RequestBody AsignarIpSolicitud solicitud,
            Authentication authentication
    ) {
        Usuario operador = resolverUsuarioOperador(authentication);
        return ResponseEntity.ok(gestionService.asignarIp(id, solicitud.ipEstatica(), operador));
    }

    @DeleteMapping("/{id}/ip")
    public ResponseEntity<EquipoDetalle> liberarIp(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        Usuario operador = resolverUsuarioOperador(authentication);
        return ResponseEntity.ok(gestionService.liberarIp(id, operador));
    }

    private Usuario resolverUsuarioOperador(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
    }
}
