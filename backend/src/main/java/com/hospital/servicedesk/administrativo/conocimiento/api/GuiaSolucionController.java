package com.hospital.servicedesk.administrativo.conocimiento.api;

import com.hospital.servicedesk.administrativo.conocimiento.aplicacion.GuiaSolucionService;
import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;
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
@RequestMapping({"/api/conocimiento", "/api/kedb"})
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class GuiaSolucionController {

    private final GuiaSolucionService service;
    private final ResolutorContextoActor resolutorActor;

    @GetMapping
    public PaginaRespuesta<GuiaRespuesta> buscar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Integer categoriaId,
            @RequestParam(required = false) AmbitoGuia ambito,
            @RequestParam(defaultValue = "false") boolean soloPublicas,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano,
            Authentication auth, HttpServletRequest request) {
        return service.buscar(texto, categoriaId, ambito, soloPublicas, pagina, tamano, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/destacadas")
    public List<GuiaRespuesta > destacadas(@RequestParam(defaultValue = "5") int limite,
                                           Authentication auth, HttpServletRequest request) {
        return service.destacadas(limite, resolutorActor.resolver(auth, request));
    }

    @GetMapping("/conteos-categoria")
    public List<ConteoCategoriaRespuesta> contarPorCategoria(Authentication auth, HttpServletRequest request) {
        return service.contarPorCategoria(resolutorActor.resolver(auth, request));
    }

    @GetMapping("/{id}")
    public GuiaRespuesta obtener(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        return service.obtener(id, resolutorActor.resolver(auth, request));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    public ResponseEntity<GuiaRespuesta> crear(@Valid @RequestBody GuiaFormulario formulario,
                                               Authentication auth, HttpServletRequest request) {
        GuiaRespuesta creada = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/conocimiento/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    public GuiaRespuesta actualizar(@PathVariable Integer id, @Valid @RequestBody GuiaFormulario formulario,
                                     Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archivar(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.archivar(id, resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/votar")
    public GuiaRespuesta votar(@PathVariable Integer id, @Valid @RequestBody VotoFormulario voto,
                               Authentication auth, HttpServletRequest request) {
        return service.votar(id, voto.util(), resolutorActor.resolver(auth, request));
    }

    @PostMapping("/{id}/visita")
    @ResponseStatus(HttpStatus.OK)
    public void registrarVisita(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.registrarVisita(id, resolutorActor.resolver(auth, request));
    }
}
