path = "backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/notificacion/NotificadorCompromisosAtencion.java"
content = """package com.hospital.servicedesk.operaciones.compromisos.notificacion;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.operaciones.compromisos.config.ConfiguracionTareasSegundoPlano;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.CorreoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificadorCompromisosAtencion {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CorreoService correoService;
    private final UsuarioRepository usuarioRepository;
    private final PropiedadesCompromisoAtencion propiedades;

    @Async(ConfiguracionTareasSegundoPlano.EJECUTOR_NOTIFICACIONES)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alCambiarCompromiso(CompromisoAtencionCambiadoEvento e) {
        boolean vencido = e.estadoNuevo() == EstadoSLA.VENCIDO;
        boolean notificar = e.prioridad() == Prioridad.CRITICA || (e.prioridad() == Prioridad.ALTA && vencido);
        log.info("Compromiso de atención del ticket #{} ({}): {} → {}", e.idTicket(),
                PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()), e.estadoAnterior(), e.estadoNuevo());
        if (!notificar) return;

        Set<String> destinatarios = new LinkedHashSet<>();
        if (e.correoTecnico() != null) destinatarios.add(e.correoTecnico());
        destinatarios.addAll(propiedades.correosSupervision());
        if (e.prioridad() == Prioridad.CRITICA) destinatarios.addAll(correosAdministradores());

        String asunto = (vencido ? "[VENCIDO]" : "[EN RIESGO]") + " Ticket #" + e.idTicket() + " (" + PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()) + ")";
        String contenido = \"\"\"
                <div style=\"font-family:Arial,sans-serif;font-size:14px;color:#333;\">
                  <h3 style=\"color:%s;\">Compromiso de atención: %s</h3>
                  <p><b>Ticket:</b> #%d — %s</p>
                  <p><b>Área:</b> %s</p>
                  <p><b>Técnico asignado:</b> %s</p>
                  <p><b>Límite SLA:</b> %s</p>
                  <p><b>Estado anterior:</b> %s → <b>Nuevo estado:</b> %s</p>
                </div>
                \"\"\".formatted(
                vencido ? "#d9534f" : "#f0ad4e",
                vencido ? "VENCIDO" : "EN RIESGO",
                e.idTicket(),
                e.asunto(),
                e.areaNombre(),
                e.nombreTecnico() != null ? e.nombreTecnico() : "Sin asignar",
                e.fechaLimite() != null ? e.fechaLimite().format(HORA) : "N/D",
                e.estadoAnterior(),
                e.estadoNuevo()
        );

        for (String dest : destinatarios) {
            try {
                correoService.enviarAlerta(dest, asunto, contenido);
            } catch (Exception ex) {
                log.error("No se pudo enviar alerta de SLA al correo {}: {}", dest, ex.getMessage());
            }
        }
    }

    private List<String> correosAdministradores() {
        return usuarioRepository.findAll().stream()
                .filter(u -> "ADMINISTRADOR".equalsIgnoreCase(u.getRol()) && u.getCorreo() != null)
                .map(Usuario::getCorreo)
                .toList();
    }
}
"""
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Rewrote NotificadorCompromisosAtencion cleanly")
