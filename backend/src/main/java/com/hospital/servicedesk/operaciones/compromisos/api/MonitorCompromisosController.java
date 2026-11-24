package com.hospital.servicedesk.operaciones.compromisos.api;

import com.hospital.servicedesk.operaciones.compromisos.EvaluadorCompromisosAtencion;
import com.hospital.servicedesk.operaciones.compromisos.aplicacion.ResumenCicloMonitor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/compromisos-atencion")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class MonitorCompromisosController {

    private final EvaluadorCompromisosAtencion evaluador;

    @PostMapping("/evaluar")
    public ResponseEntity<ResumenCicloMonitor> evaluarManual() {
        ResumenCicloMonitor resumen = evaluador.ejecutarCiclo();
        return ResponseEntity.ok(resumen);
    }

    @GetMapping("/ultimo-ciclo")
    public ResponseEntity<Object> obtenerUltimoCiclo() {
        return evaluador.ultimoCiclo()
                .<ResponseEntity<Object>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("mensaje", "Aún no se ha ejecutado ningún ciclo de monitorización.")));
    }
}
