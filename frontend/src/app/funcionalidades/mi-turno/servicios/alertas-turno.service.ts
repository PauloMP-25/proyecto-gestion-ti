import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent } from 'rxjs';
import { TicketTurno } from '../modelos/ticket-turno.model';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { calcularSla } from '../../../compartido/utilidades/calculo-sla';

export interface AnuncioAccesible {
  id: string;
  mensaje: string;
  tipo: 'polite' | 'assertive';
  fechaMs: number;
}

@Injectable({ providedIn: 'root' })
export class AlertasTurnoService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly online = signal<boolean>(true);
  readonly ultimoAnuncio = signal<AnuncioAccesible | null>(null);

  /** Guarda el último estado de SLA conocido por ticket para no repetir anuncios */
  private estadosSlaPrevios = new Map<number, EstadoSla>();

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      this.online.set(navigator.onLine ?? true);

      fromEvent(window, 'online').subscribe(() => {
        this.online.set(true);
        this.emitirAnuncio('Conexión restablecida. La información del turno está sincronizada.', 'polite');
      });

      fromEvent(window, 'offline').subscribe(() => {
        this.online.set(false);
        this.emitirAnuncio('Sin conexión a la red hospitalaria. Se muestran los últimos datos registrados.', 'assertive');
      });
    }
  }

  /**
   * Evalúa la lista de tickets activos y detecta transiciones de SLA que requieran anuncio auditivo.
   * - A_TIEMPO -> ALERTA (polite): "Ticket X por vencer"
   * - ALERTA o A_TIEMPO -> INCUMPLIDO:
   *     - Si P1: assertive ("Atención: Ticket crítico X ha vencido")
   *     - Si P2-P4: polite ("Ticket X ha vencido")
   */
  inspeccionarTransicionesSla(tickets: TicketTurno[], ahoraMs = Date.now()): void {
    for (const ticket of tickets) {
      if (ticket.sla.fase === 'COMPLETADO') continue;

      const slaActual = calcularSla(ticket.sla, ahoraMs);
      const estadoPrevio = this.estadosSlaPrevios.get(ticket.id);

      if (estadoPrevio && estadoPrevio !== slaActual.estado) {
        if (slaActual.estado === EstadoSla.ALERTA) {
          this.emitirAnuncio(
            `El ticket ${ticket.codigo} (${ticket.areaNombre}) ha pasado a estado por vencer.`,
            'polite'
          );
        } else if (slaActual.estado === EstadoSla.INCUMPLIDO) {
          const esCritico = ticket.prioridad === Prioridad.P1_CRITICA;
          this.emitirAnuncio(
            esCritico
              ? `Atención prioritaria: El ticket crítico ${ticket.codigo} de ${ticket.areaNombre} ha superado el tiempo límite.`
              : `El ticket ${ticket.codigo} de ${ticket.areaNombre} ha vencido su tiempo de compromiso.`,
            esCritico ? 'assertive' : 'polite'
          );
        }
      }

      this.estadosSlaPrevios.set(ticket.id, slaActual.estado);
    }
  }

  emitirAnuncio(mensaje: string, tipo: 'polite' | 'assertive'): void {
    this.ultimoAnuncio.set({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      mensaje,
      tipo,
      fechaMs: Date.now(),
    });
  }

  limpiarHistorial(): void {
    this.estadosSlaPrevios.clear();
    this.ultimoAnuncio.set(null);
  }
}
