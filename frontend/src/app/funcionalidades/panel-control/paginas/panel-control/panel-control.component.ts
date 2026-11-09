import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { PanelControlService } from '../../servicios/panel-control.service';
import { KpiPanelComponent } from '../../../../compartido/ui/organismos/kpi-panel/kpi-panel.component';
import { TablaTicketsComponent } from '../../../../compartido/ui/organismos/tabla-tickets/tabla-tickets.component';
import { BuscadorFiltrosComponent, FiltroOpcion } from '../../../../compartido/ui/moleculas/buscador-filtros/buscador-filtros.component';
import { GraficoPorServicioComponent } from '../../componentes/grafico-por-servicio/grafico-por-servicio.component';
import { DistribucionTipoComponent } from '../../componentes/distribucion-tipo/distribucion-tipo.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    KpiPanelComponent,
    TablaTicketsComponent,
    BuscadorFiltrosComponent,
    GraficoPorServicioComponent,
    DistribucionTipoComponent,
    BotonComponent,
    IconoComponent,
  ],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelControlComponent {
  private authService = inject(AuthService);
  private panelService = inject(PanelControlService);

  readonly usuarioActual = this.authService.usuarioActual;
  readonly rolActual = this.authService.rolActual;
  readonly RolUsuario = RolUsuario;

  readonly kpis = this.panelService.kpis;
  readonly ticketsFiltrados = this.panelService.ticketsFiltrados;
  readonly filtroChipActivo = this.panelService.filtroChip;

  readonly ticketSeleccionado = signal<TicketResumen | null>(null);

  readonly opcionesFiltro: FiltroOpcion[] = [
    { id: 'todos', etiqueta: 'Todos los activos', conteo: 26 },
    { id: 'p1', etiqueta: 'P1 Críticos (STAT)', conteo: 3, icono: 'emergency' },
    { id: 'sla_riesgo', etiqueta: 'SLA en riesgo', conteo: 2, icono: 'warning' },
    { id: 'sin_asignar', etiqueta: 'Sin asignar', conteo: 1, icono: 'person_off' },
    { id: 'escalados', etiqueta: 'Escalados N2', conteo: 2, icono: 'escalator_warning' },
  ];

  onBuscar(texto: string): void {
    this.panelService.filtroTexto.set(texto);
  }

  onSeleccionarChip(chipId: string): void {
    this.panelService.filtroChip.set(chipId);
  }

  onSeleccionarTicket(ticket: TicketResumen): void {
    this.ticketSeleccionado.set(ticket);
  }

  onAtenderTicket(ticket: TicketResumen): void {
    this.ticketSeleccionado.set(ticket);
  }

  refrescar(): void {
    this.panelService.refrescarDatos();
  }
}
