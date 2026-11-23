package com.hospital.servicedesk.controllers;

import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.ReporteEjecutivoPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteEjecutivoPdfService reporteService;
    private final UsuarioRepository usuarioRepository;
    private final com.hospital.servicedesk.services.CorreoService correoService;

    @GetMapping("/ejecutivo/pdf")
    @PreAuthorize("hasAnyRole('PRACTICANTE', 'ADMINISTRADOR')")
    public ResponseEntity<byte[]> descargarReporteEjecutivoPdf(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            Authentication auth
    ) {
        LocalDateTime fInicio = null;
        LocalDateTime fFin = null;

        if (desde != null && !desde.isBlank()) {
            try {
                fInicio = LocalDateTime.parse(desde);
            } catch (Exception e) {
                log.warn("Formato inválido para parámetro 'desde': {}", desde);
            }
        }

        if (hasta != null && !hasta.isBlank()) {
            try {
                fFin = LocalDateTime.parse(hasta);
            } catch (Exception e) {
                log.warn("Formato inválido para parámetro 'hasta': {}", hasta);
            }
        }

        String username = auth != null ? auth.getName() : "admin";
        log.info("Generando informe ejecutivo PDF solicitado por: {} | Filtros: desde='{}', hasta='{}'",
                username, desde != null ? desde : "TODOS", hasta != null ? hasta : "TODOS");

        byte[] pdfBytes = reporteService.generarReporteEjecutivoPdf(fInicio, fFin, username);

        log.info("Informe ejecutivo PDF generado exitosamente para: {} (Tamaño: {} bytes)", username, pdfBytes.length);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "informe-ejecutivo-mesa-ayuda-hsmsi.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/ejecutivo/enviar-correo")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> enviarReporteEjecutivoCorreo(
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            Authentication auth
    ) {
        LocalDateTime fInicio = null;
        LocalDateTime fFin = null;

        if (desde != null && !desde.isBlank()) {
            try {
                fInicio = LocalDateTime.parse(desde);
            } catch (Exception e) {
                log.warn("Formato inválido para parámetro 'desde': {}", desde);
            }
        }

        if (hasta != null && !hasta.isBlank()) {
            try {
                fFin = LocalDateTime.parse(hasta);
            } catch (Exception e) {
                log.warn("Formato inválido para parámetro 'hasta': {}", hasta);
            }
        }

        String username = auth != null ? auth.getName() : "admin";
        log.info("Iniciando solicitud de envío de informe ejecutivo por correo para administrador: {}", username);

        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(username)
                .or(() -> usuarioRepository.findByNombreUsuario(username))
                .orElse(null);

        String destinatario = usuario != null && usuario.getCorreo() != null ? usuario.getCorreo() : username;

        byte[] pdfBytes = reporteService.generarReporteEjecutivoPdf(fInicio, fFin, username);
        String nombreCompleto = usuario != null ? (usuario.getNombres() + " " + usuario.getApellidos()).trim() : "Administrador";
        
        correoService.enviarReporteEjecutivo(destinatario, nombreCompleto, pdfBytes, "informe-ejecutivo-hsmsi.pdf");
        log.info("Informe ejecutivo enviado por correo satisfactoriamente a: {} (Archivo: informe-ejecutivo-hsmsi.pdf, {} bytes)",
                destinatario, pdfBytes.length);

        return ResponseEntity.ok(Map.of(
                "mensaje", "El informe ejecutivo oficial en formato PDF fue enviado satisfactoriamente al correo institucional: " + destinatario,
                "destinatario", destinatario,
                "tamanoBytes", pdfBytes.length
        ));
    }
}
