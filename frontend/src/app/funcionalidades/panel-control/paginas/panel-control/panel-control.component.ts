import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { PanelControlService } from '../../servicios/panel-control.service';
import { KpiPanelComponent } from '../../../../compartido/ui/organismos/kpi-panel/kpi-panel.component';
import { GraficoPorServicioComponent } from '../../componentes/grafico-por-servicio/grafico-por-servicio.component';
import { DistribucionTipoComponent } from '../../componentes/distribucion-tipo/distribucion-tipo.component';
import { GraficoPrioridadesComponent } from '../../componentes/grafico-prioridades/grafico-prioridades.component';
import { GraficoSlaCumplimientoComponent } from '../../componentes/grafico-sla-cumplimiento/grafico-sla-cumplimiento.component';
import { RelojTicketActivoComponent } from '../../componentes/reloj-ticket-activo/reloj-ticket-activo.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';

export type TipoPestanaPanel = 'metricas' | 'graficos';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    KpiPanelComponent,
    GraficoPorServicioComponent,
    DistribucionTipoComponent,
    GraficoPrioridadesComponent,
    GraficoSlaCumplimientoComponent,
    RelojTicketActivoComponent,
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
  private router = inject(Router);

  onNuevoIncidente(): void {
    this.router.navigate(['/solicitudes/nuevo']);
  }

  readonly usuarioActual = this.authService.usuarioActual;
  readonly rolActual = this.authService.rolActual;
  readonly RolUsuario = RolUsuario;

  readonly kpis = this.panelService.kpis;
  readonly ticketsFiltrados = this.panelService.ticketsFiltrados;

  // Navegación por pestañas
  readonly pestanaActiva = signal<TipoPestanaPanel>('metricas');

  // Ticket en atención activa para el cronómetro de la Pestaña 1
  readonly ticketEnAtencion = signal<TicketResumen | null>(null);

  constructor() {
    // Inicializar el ticket en atención con el primer ticket crítico si existe
    const tickets = this.panelService.ticketsFiltrados();
    if (tickets.length > 0) {
      this.ticketEnAtencion.set(tickets[0]);
    }
  }

  seleccionarPestana(pestana: TipoPestanaPanel): void {
    this.pestanaActiva.set(pestana);
  }

  onSeleccionarTicket(ticket: TicketResumen): void {
    this.ticketEnAtencion.set(ticket);
  }

  onResolverTicket(ticket: TicketResumen): void {
    this.panelService.refrescarDatos();
  }

  onEscalarTicket(ticket: TicketResumen): void {
    console.log('Escalando ticket a Nivel 2:', ticket.codigo);
  }

  refrescar(): void {
    this.panelService.refrescarDatos();
  }
}

