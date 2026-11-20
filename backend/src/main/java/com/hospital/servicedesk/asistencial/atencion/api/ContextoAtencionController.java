package com.hospital.servicedesk.asistencial.atencion.api;

import com.hospital.servicedesk.asistencial.atencion.aplicacion.ContextoAtencionService;
import com.hospital.servicedesk.asistencial.atencion.dto.ContextoAtencionRespuesta;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.security.red.ResolutorIpCliente;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador para la autodetección del contexto asistencial de atención.
 * Accesible para cualquier colaborador autenticado en el hospital.
 */
@RestController
@RequestMapping("/api/contexto-atencion")
public class ContextoAtencionController {

    private final ContextoAtencionService contextoAtencionService;
    private final ResolutorIpCliente resolutorIpCliente;
    private final UsuarioRepository usuarioRepository;

    public ContextoAtencionController(
            ContextoAtencionService contextoAtencionService,
            ResolutorIpCliente resolutorIpCliente,
            UsuarioRepository usuarioRepository
    ) {
        this.contextoAtencionService = contextoAtencionService;
        this.resolutorIpCliente = resolutorIpCliente;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping
    public ResponseEntity<ContextoAtencionRespuesta> obtenerContexto(
            HttpServletRequest request,
            Authentication authentication
    ) {
        String ipOrigen = resolutorIpCliente.resolverIp(request);
        Usuario usuario = null;
        if (authentication != null && authentication.getName() != null) {
            usuario = usuarioRepository.findByCorreo(authentication.getName()).orElse(null);
        }

        ContextoAtencionRespuesta respuesta = contextoAtencionService.resolver(ipOrigen, usuario);
        return ResponseEntity.ok(respuesta);
    }
}
