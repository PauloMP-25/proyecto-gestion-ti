import { Injectable, inject } from '@angular/core';
import { LoggerService } from '../../nucleo/servicios/logger.service';
import { EstadoTicket } from './estado-ticket.enum';
import { EstadoSLA } from './estado-sla.enum';
import { PrioridadTicket } from './prioridad.enum';
import { NivelSoporte } from './nivel-soporte.enum';
import { Pagina } from './pagina.model';
import { Ticket, TicketResumen } from './ticket.model';

const ALIAS_ESTADO: Record<string, EstadoTicket> = {
  EN_ATENCION: EstadoTicket.EN_PROCESO,
  ABIERTO: EstadoTicket.NUEVO,
  EN_PROGRESO: EstadoTicket.EN_PROCESO,
};

const ALIAS_PRIORIDAD: Record<string, PrioridadTicket> = {
  P1_CRITICA: PrioridadTicket.P1,
  CRITICA: PrioridadTicket.P1,
  P2_ALTA: PrioridadTicket.P2,
  ALTA: PrioridadTicket.P2,
  P3_MEDIA: PrioridadTicket.P3,
  MEDIA: PrioridadTicket.P3,
  P4_BAJA: PrioridadTicket.P4,
  BAJA: PrioridadTicket.P4,
};

const ALIAS_SLA: Record<string, EstadoSLA> = {
  DENTRO_TIEMPO: EstadoSLA.A_TIEMPO,
  POR_VENCER: EstadoSLA.ALERTA,
  VENCIDO: EstadoSLA.INCUMPLIDO,
};

@Injectable({ providedIn: 'root' })
export class TicketMapper {
  private logger = inject(LoggerService);

  estado(raw: unknown): EstadoTicket {
    const valor = String(raw ?? '');
    if (valor in ALIAS_ESTADO) return ALIAS_ESTADO[valor];
    if (Object.values(EstadoTicket).includes(valor as EstadoTicket)) return valor as EstadoTicket;
    this.logger.warn(`Estado de ticket desconocido: "${valor}". Se usa NUEVO.`);
    return EstadoTicket.NUEVO;
  }

  prioridad(raw: unknown): PrioridadTicket {
    const valor = String(raw ?? '');
    if (valor in ALIAS_PRIORIDAD) return ALIAS_PRIORIDAD[valor];
    if (Object.values(PrioridadTicket).includes(valor as PrioridadTicket)) return valor as PrioridadTicket;
    if (valor in PrioridadTicket) return PrioridadTicket[valor as keyof typeof PrioridadTicket];
    this.logger.warn(`Prioridad desconocida: "${valor}". Se usa P4.`);
    return PrioridadTicket.P4;
  }

  estadoSla(raw: unknown): EstadoSLA {
    const valor = String(raw ?? '');
    if (valor in ALIAS_SLA) return ALIAS_SLA[valor];
    if (Object.values(EstadoSLA).includes(valor as EstadoSLA)) return valor as EstadoSLA;
    this.logger.warn(`Estado SLA desconocido: "${valor}". Se usa A_TIEMPO.`);
    return EstadoSLA.A_TIEMPO;
  }

  nivelSoporte(raw: unknown): NivelSoporte {
    const valor = String(raw ?? '');
    if (valor === NivelSoporte.N1 || valor === NivelSoporte.N2) return valor;
    this.logger.warn(`Nivel de soporte desconocido: "${valor}". Se usa N1.`);
    return NivelSoporte.N1;
  }

  resumen(raw: any): TicketResumen {
    return {
      id: raw.id,
      codigo: raw.codigo,
      tipo: raw.tipo === 'SOLICITUD' ? 'SOLICITUD' : 'INCIDENTE',
      titulo: raw.titulo,
      prioridad: this.prioridad(raw.prioridad),
      estado: this.estado(raw.estado),
      estadoSla: this.estadoSla(raw.estadoSla),
      nivelSoporte: this.nivelSoporte(raw.nivelSoporte),
      area: raw.area,
      solicitante: raw.solicitante,
      asignadoA: raw.asignadoA ?? null,
      fechaCreacion: raw.fechaCreacion,
      fechaLimiteResolucion: raw.fechaLimiteResolucion ?? null,
    };
  }

  detalle(raw: any): Ticket {
    return {
      ...this.resumen(raw),
      descripcion: raw.descripcion ?? '',
      categoria: raw.categoria,
      impacto: raw.impacto,
      urgencia: raw.urgencia,
      anexoContacto: raw.anexoContacto ?? null,
      equipo: raw.equipo ?? null,
      ipOrigen: raw.ipOrigen ?? null,
      fechaAsignacion: raw.fechaAsignacion ?? null,
      fechaLimiteRespuesta: raw.fechaLimiteRespuesta ?? null,
      fechaRespuestaReal: raw.fechaRespuestaReal ?? null,
      fechaResolucionReal: raw.fechaResolucionReal ?? null,
      fechaCierre: raw.fechaCierre ?? null,
      historial: (raw.historial ?? []).map((h: any) => ({
        fecha: h.fecha,
        usuario: h.usuario,
        estadoAnterior: h.estadoAnterior == null ? null : this.estado(h.estadoAnterior),
        estadoNuevo: this.estado(h.estadoNuevo),
        comentario: h.comentario ?? '',
      })),
      escalamientos: (raw.escalamientos ?? []).map((e: any) => ({
        fecha: e.fecha,
        nivelOrigen: this.nivelSoporte(e.nivelOrigen),
        nivelDestino: this.nivelSoporte(e.nivelDestino),
        usuarioOrigen: e.usuarioOrigen,
        usuarioDestino: e.usuarioDestino ?? null,
        motivo: e.motivo,
      })),
      soluciones: raw.soluciones ?? [],
    };
  }

  pagina<T>(raw: any, mapearItem: (item: any) => T): Pagina<T> {
    return {
      contenido: (raw.contenido ?? []).map(mapearItem),
      pagina: raw.pagina ?? 0,
      tamano: raw.tamano ?? 10,
      totalElementos: raw.totalElementos ?? 0,
      totalPaginas: raw.totalPaginas ?? 0,
    };
  }
}