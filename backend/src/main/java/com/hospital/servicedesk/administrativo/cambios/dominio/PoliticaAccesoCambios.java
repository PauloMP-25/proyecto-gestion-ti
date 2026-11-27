package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.SolicitudCambio;
import com.hospital.servicedesk.entities.Usuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class PoliticaAccesoCambios {

    public void verificarEdicion(SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        exigir(ctx.esAdministrador() || esSolicitante(s, actor),
                "Solo quien registró la solicitud puede modificarla.");
    }

    public void verificarTransicion(AccionCambio accion, SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        boolean solicitante = esSolicitante(s, actor);
        switch (accion) {
            case ENVIAR_EVALUACION, CANCELAR ->
                    exigir(ctx.esAdministrador() || solicitante, "Solo quien registró la solicitud puede hacerlo.");
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> {
                exigir(ctx.esAdministrador(), "Solo el comité de evaluación puede decidir sobre una solicitud.");
                exigir(!solicitante, "Quien registró la solicitud no puede evaluarla.");
            }
            case INICIAR_EJECUCION, MARCAR_IMPLEMENTADO ->
                    exigir(ctx.esPersonalTecnico(), "Solo el personal técnico puede ejecutar cambios.");
        }
    }

    private static boolean esSolicitante(SolicitudCambio s, Usuario actor) {
        return s.getSolicitante().getIdUsuario().equals(actor.getIdUsuario());
    }

    private static void exigir(boolean condicion, String mensaje) {
        if (!condicion) throw new AccessDeniedException(mensaje);
    }
}
