package com.hospital.servicedesk.administrativo.cambios.eventos;

import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.entities.ImpactoAsistencial;

public record SolicitudCambioTransicionadaEvento(
        Integer idSolicitud, String codigo, String titulo, AccionCambio accion,
        EstadoCambio estadoAnterior, EstadoCambio estadoNuevo, ImpactoAsistencial impacto, String correoActor) {}
