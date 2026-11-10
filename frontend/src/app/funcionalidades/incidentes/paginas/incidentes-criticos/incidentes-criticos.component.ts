import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router'; 
import { IncidentesService, FiltroColaCritica } from '../../servicios/incidentes.service';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';
import { TablaTicketsComponent } from '../../../../compartido/ui/organismos/tabla-tickets/tabla-tickets.component';
import {
  BuscadorFiltrosComponent,
  FiltroOpcion,
} from '../../../../compartido/ui/moleculas/buscador-filtros/buscador-filtros.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-incidentes-criticos',
  standalone: true,
  imports: [
    DatePipe,
    TablaTicketsComponent,
    BuscadorFiltrosComponent,
    BotonComponent,
    IconoComponent,
  ],
  templateUrl: './incidentes-criticos.component.html',
  styleUrl: './incidentes-criticos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidentesCriticosComponent {
  private readonly incidentesService = inject(IncidentesService);
  private readonly router = inject(Router);

  readonly tickets = this.incidentesService.ticketsFiltrados;
  readonly filtroActivo = this.incidentesService.filtroChip;
  readonly ultimaActualizacion = this.incidentesService.ultimaActualizacion;

  /** Chips con conteos en vivo, en el orden definido en la especificación. */
  readonly opcionesFiltro = computed<FiltroOpcion[]>(() => {
    const c = this.incidentesService.conteos();
    return [
      { id: 'todos', etiqueta: 'Todos los activos', conteo: c.todos },
      { id: 'p1', etiqueta: 'P1 - Crítico', conteo: c.p1, icono: 'emergency' },
      { id: 'sla_riesgo', etiqueta: 'SLA en riesgo', conteo: c.sla_riesgo, icono: 'warning' },
      { id: 'sin_asignar', etiqueta: 'Sin asignar', conteo: c.sin_asignar, icono: 'person_off' },
      { id: 'escalados', etiqueta: 'Escalados N2', conteo: c.escalados, icono: 'escalator_warning' },
    ];
  });

  readonly totalActivos = computed(() => this.incidentesService.conteos().todos);

  onBuscar(texto: string): void {
    this.incidentesService.filtroTexto.set(texto);
  }

  onSeleccionarFiltro(id: string): void {
    this.incidentesService.filtroChip.set(id as FiltroColaCritica);
  }

  verTicket(ticket: TicketResumen): void {
    this.router.navigate(['/incidentes', ticket.id]);
  }

  nuevoIncidente(): void {
    this.router.navigate(['/incidentes/nuevo']);
  }

  actualizar(): void {
    this.incidentesService.refrescar();
  }
}