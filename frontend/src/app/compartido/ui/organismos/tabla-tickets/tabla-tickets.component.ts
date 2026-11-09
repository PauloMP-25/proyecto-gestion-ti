import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketResumen } from '../../../modelos/ticket-resumen.model';
import { PrioridadInsigniaComponent } from '../../atomos/prioridad-insignia/prioridad-insignia.component';
import { EstadoEtiquetaComponent } from '../../atomos/estado-etiqueta/estado-etiqueta.component';
import { NivelInsigniaComponent } from '../../atomos/nivel-insignia/nivel-insignia.component';
import { TemporizadorSlaComponent } from '../../moleculas/temporizador-sla/temporizador-sla.component';
import { BotonComponent } from '../../atomos/boton/boton.component';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-tabla-tickets',
  standalone: true,
  imports: [
    CommonModule,
    PrioridadInsigniaComponent,
    EstadoEtiquetaComponent,
    NivelInsigniaComponent,
    TemporizadorSlaComponent,
    BotonComponent,
    IconoComponent,
  ],
  templateUrl: './tabla-tickets.component.html',
  styleUrl: './tabla-tickets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaTicketsComponent {
  readonly tickets = input.required<TicketResumen[]>();
  readonly tamanoPagina = input<number>(6);

  readonly alSeleccionarTicket = output<TicketResumen>();
  readonly alAtenderTicket = output<TicketResumen>();

  readonly paginaActual = signal<number>(1);

  readonly totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.tickets().length / this.tamanoPagina()));
  });

  readonly ticketsPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.tamanoPagina();
    return this.tickets().slice(inicio, inicio + this.tamanoPagina());
  });

  irAPagina(pag: number): void {
    if (pag >= 1 && pag <= this.totalPaginas()) {
      this.paginaActual.set(pag);
    }
  }
}
