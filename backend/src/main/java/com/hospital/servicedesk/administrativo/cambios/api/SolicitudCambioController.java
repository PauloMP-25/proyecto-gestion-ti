package com.hospital.servicedesk.administrativo.cambios.api;

import com.hospital.servicedesk.administrativo.cambios.aplicacion.SolicitudCambioService;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.entities.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({"/api/solicitudes-cambio", "/api/rfc"})
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
@RequiredArgsConstructor
public class SolicitudCambioController {

    private final SolicitudCambioService service;
    private final ResolutorContextoActor resolutorActor;

    @GetMapping
    public List<CambioResumenRespuesta> listar(@RequestParam(required = false) EstadoCambio estado,
                                               @RequestParam(required = false) ImpactoAsistencial impacto,
                                               @RequestParam(required = false) TipoCambio tipo,
                                               @RequestParam(required = false) String texto) {
        return service.listar(estado, impacto, tipo, texto);
    }

    @GetMapping("/{id}")
    public CambioDetalleRespuesta obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<CambioDetalleRespuesta> crear(@Valid @RequestBody SolicitudCambioFormulario formulario,
                                                        Authentication auth, HttpServletRequest request) {
        CambioDetalleRespuesta creado = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/solicitudes-cambio/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public CambioDetalleRespuesta actualizar(@PathVariable Integer id,
                                               @Valid @RequestBody SolicitudCambioFormulario formulario,
                                               Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/transicionar")
    public CambioDetalleRespuesta transicionar(@PathVariable Integer id,
                                               @Valid @RequestBody TransicionCambioSolicitud transicion,
                                               Authentication auth, HttpServletRequest request) {
        return service.transicionar(id, transicion, resolutorActor.resolver(auth, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.eliminar(id, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/areas-seleccionables")
    public List<AreaAfectadaRespuesta> listarAreasSeleccionables() {
        return service.listarAreasSeleccionables();
    }
}
