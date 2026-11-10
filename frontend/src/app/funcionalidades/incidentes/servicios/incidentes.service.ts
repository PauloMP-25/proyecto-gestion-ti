import { Injectable, computed, inject, signal } from '@angular/core';
import { PanelControlService } from '../../panel-control/servicios/panel-control.service';
import { RelojServidorService } from '../../../nucleo/servicios/reloj-servidor.service';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';
import { TicketResumen } from '../../../compartido/modelos/ticket-resumen.model';

/** Identificadores de los filtros rápidos de la cola de incidentes críticos. */
export type FiltroColaCritica = 'todos' | 'p1' | 'sla_riesgo' | 'sin_asignar' | 'escalados';

/** Porcentaje de SLA consumido a partir del cual un ticket se considera "en riesgo". */
const UMBRAL_SLA_RIESGO_PCT = 80;

const PESO_PRIORIDAD: Record<PrioridadTicket, number> = {
  [PrioridadTicket.P1]: 1,
  [PrioridadTicket.P2]: 2,
  [PrioridadTicket.P3]: 3,
  [PrioridadTicket.P4]: 4,
};

@Injectable({
  providedIn: 'root',
})
export class IncidentesService {
  private readonly panelService = inject(PanelControlService);
  private readonly reloj = inject(RelojServidorService);

  readonly filtroTexto = signal<string>('');
  readonly filtroChip = signal<FiltroColaCritica>('p1');

  readonly ultimaActualizacion = this.panelService.ultimaActualizacion;

  /**
   * Cola viva: incidentes (no solicitudes) que siguen abiertos.
   * Es la base sobre la que se calculan los conteos de cada filtro rápido.
   */
  readonly colaActiva = computed<TicketResumen[]>(() =>
    this.panelService
      .tickets()
      .filter(
        (t) =>
          t.tipo === 'INCIDENTE' &&
          t.estado !== EstadoTicket.RESUELTO &&
          t.estado !== EstadoTicket.CERRADO,
      ),
  );

  /** Conteo de cada chip; se recalcula con el reloj porque el riesgo de SLA cambia en vivo. */
  readonly conteos = computed<Record<FiltroColaCritica, number>>(() => {
    const cola = this.colaActiva();
    return {
      todos: cola.length,
      p1: cola.filter((t) => this.esP1(t)).length,
      sla_riesgo: cola.filter((t) => this.estaEnRiesgo(t)).length,
      sin_asignar: cola.filter((t) => this.estaSinAsignar(t)).length,
      escalados: cola.filter((t) => this.estaEscalado(t)).length,
    };
  });

  /** Tickets que ya se están viendo con filtro de chip + búsqueda aplicados y ordenados por urgencia. */
  readonly ticketsFiltrados = computed<TicketResumen[]>(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const chip = this.filtroChip();

    let lista = this.colaActiva().filter((t) => this.coincideConChip(t, chip));

    if (texto) {
      lista = lista.filter(
        (t) =>
          t.codigo.toLowerCase().includes(texto) ||
          t.titulo.toLowerCase().includes(texto) ||
          t.areaClinica.toLowerCase().includes(texto) ||
          (t.activoAfectado?.nombre?.toLowerCase().includes(texto) ?? false) ||
          (t.activoAfectado?.ip?.includes(texto) ?? false),
      );
    }

    // P1 primero; dentro de cada prioridad, el SLA que vence antes (o ya venció) va arriba.
    return [...lista].sort((a, b) => {
      const dif = PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad];
      if (dif !== 0) return dif;
      return (
        new Date(a.slaResolucion.fechaVencimiento).getTime() -
        new Date(b.slaResolucion.fechaVencimiento).getTime()
      );
    });
  });

  refrescar(): void {
    this.panelService.refrescarDatos();
  }

  private coincideConChip(t: TicketResumen, chip: FiltroColaCritica): boolean {
    switch (chip) {
      case 'p1':
        return this.esP1(t);
      case 'sla_riesgo':
        return this.estaEnRiesgo(t);
      case 'sin_asignar':
        return this.estaSinAsignar(t);
      case 'escalados':
        return this.estaEscalado(t);
      default:
        return true;
    }
  }

  private esP1(t: TicketResumen): boolean {
    return t.prioridad === PrioridadTicket.P1;
  }

  private estaSinAsignar(t: TicketResumen): boolean {
    return !t.responsable || t.estado === EstadoTicket.NUEVO;
  }

  private estaEscalado(t: TicketResumen): boolean {
    return t.nivelActual === 'N2';
  }

  /**
   * "En riesgo" = SLA vencido, consumido por encima del umbral, o marcado así por el backend.
   * Usa el reloj del servidor para que el chip se actualice solo, igual que el temporizador de la tabla.
   */
  private estaEnRiesgo(t: TicketResumen): boolean {
    const sla = t.slaResolucion;
    if (sla.estado === EstadoSLA.ALERTA || sla.estado === EstadoSLA.INCUMPLIDO) return true;

    const ahora = this.reloj.ahora();
    const inicio = new Date(sla.fechaInicio).getTime();
    const vence = new Date(sla.fechaVencimiento).getTime();
    if (ahora >= vence) return true;

    const total = vence - inicio;
    if (total <= 0) return true;
    return ((ahora - inicio) / total) * 100 >= UMBRAL_SLA_RIESGO_PCT;
  }
}
