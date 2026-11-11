import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Area } from '../../../../compartido/modelos/ticket.dto';
import { TicketFiltros } from '../../../../compartido/modelos/ticket-filtros.model';
import { EstadoTicket, EstadoTicketEtiquetas } from '../../../../compartido/modelos/estado-ticket.enum';
import { PrioridadTicket, PrioridadEtiquetas } from '../../../../compartido/modelos/prioridad.enum';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';

@Component({
  selector: 'app-incidente-filtros',
  templateUrl: './incidente-filtros.component.html',
  styleUrl: './incidente-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteFiltrosComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private destroyRef = inject(DestroyRef);
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  readonly alCambiar = output<TicketFiltros>();

  readonly areas = signal<Area[]>([]);
  readonly estado = signal<EstadoTicket | ''>('');
  readonly prioridad = signal<PrioridadTicket | ''>('');
  readonly idArea = signal<number | ''>('');
  readonly texto = signal('');

  readonly estados = Object.values(EstadoTicket);
  readonly prioridades = Object.values(PrioridadTicket);
  readonly etiquetaEstado = (e: EstadoTicket) => EstadoTicketEtiquetas[e];
  readonly etiquetaPrioridad = (p: PrioridadTicket) => PrioridadEtiquetas[p];

  ngOnInit(): void {
    this.ticketsService.areas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(a => this.areas.set(a));
    this.destroyRef.onDestroy(() => {
      if (this.temporizador) clearTimeout(this.temporizador);
    });
  }

  cambiarEstado(valor: string): void {
    this.estado.set(valor as EstadoTicket | '');
    this.emitir();
  }

  cambiarPrioridad(valor: string): void {
    this.prioridad.set(valor as PrioridadTicket | '');
    this.emitir();
  }

  cambiarArea(valor: string): void {
    this.idArea.set(valor === '' ? '' : Number(valor));
    this.emitir();
  }

  escribirTexto(valor: string): void {
    this.texto.set(valor);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.emitir(), 300);
  }

  limpiar(): void {
    this.estado.set('');
    this.prioridad.set('');
    this.idArea.set('');
    this.texto.set('');
    this.emitir();
  }

  private emitir(): void {
    this.alCambiar.emit({
      estado: this.estado(),
      prioridad: this.prioridad(),
      idArea: this.idArea(),
      texto: this.texto().trim(),
    });
  }
}