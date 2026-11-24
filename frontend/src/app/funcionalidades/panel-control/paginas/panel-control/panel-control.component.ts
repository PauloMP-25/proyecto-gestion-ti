import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { PanelControlService } from '../../servicios/panel-control.service';
import { KpiPanelComponent } from '../../../../compartido/ui/organismos/kpi-panel/kpi-panel.component';
import { GraficoPorServicioComponent } from '../../componentes/grafico-por-servicio/grafico-por-servicio.component';
import { DistribucionTipoComponent } from '../../componentes/distribucion-tipo/distribucion-tipo.component';
import { GraficoCargaTurnosComponent } from '../../componentes/grafico-carga-turnos/grafico-carga-turnos.component';
import { GraficoEstadoEquiposComponent } from '../../componentes/grafico-estado-equipos/grafico-estado-equipos.component';
import { RelojTicketActivoComponent } from '../../componentes/reloj-ticket-activo/reloj-ticket-activo.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';

import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { DialogoEscalarTicketComponent } from '../../../../compartido/ui/organismos/dialogo-escalar-ticket/dialogo-escalar-ticket.component';
import { DialogoResolverTicketComponent } from '../../../../compartido/ui/organismos/dialogo-resolver-ticket/dialogo-resolver-ticket.component';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';

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
    GraficoCargaTurnosComponent,
    GraficoEstadoEquiposComponent,
    RelojTicketActivoComponent,
    BotonComponent,
    IconoComponent,
    DialogoEscalarTicketComponent,
    DialogoResolverTicketComponent,
  ],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelControlComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private panelService = inject(PanelControlService);
  private ticketsService = inject(TicketsService);
  private notificacion = inject(NotificacionService);
  private router = inject(Router);

  readonly descargandoPdf = signal<boolean>(false);

  descargarReportePdf(): void {
    if (this.descargandoPdf()) return;

    this.descargandoPdf.set(true);
    this.http
      .get(API_ENDPOINTS.reportes.ejecutivoPdf, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          this.descargandoPdf.set(false);
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `informe-ejecutivo-hsmsi-${new Date().toISOString().slice(0, 10)}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
          this.notificacion.exito('Informe ejecutivo en formato PDF descargado exitosamente.');
        },
        error: () => {
          this.descargandoPdf.set(false);
          this.notificacion.error('No se pudo generar el informe ejecutivo en PDF.');
        },
      });
  }

  onNuevoIncidente(): void {
    this.router.navigate(['/solicitudes/nuevo']);
  }

  readonly usuarioActual = this.authService.usuarioActual;
  readonly rolActual = this.authService.rolActual;
  readonly RolUsuario = RolUsuario;
  readonly esAdministrador = computed(() => this.rolActual() === RolUsuario.ADMINISTRADOR);

  readonly enviandoCorreo = signal<boolean>(false);

  enviarReporteCorreo(): void {
    if (this.enviandoCorreo()) return;

    this.enviandoCorreo.set(true);
    this.http.post<any>(API_ENDPOINTS.reportes.enviarCorreo, {}).subscribe({
      next: (res) => {
        this.enviandoCorreo.set(false);
        this.notificacion.exito(res?.mensaje || 'Informe ejecutivo oficial enviado al correo institucional.');
      },
      error: () => {
        this.enviandoCorreo.set(false);
        this.notificacion.error('No se pudo enviar el informe ejecutivo por correo.');
      },
    });
  }

  readonly kpis = this.panelService.kpis;
  readonly ticketsFiltrados = this.panelService.ticketsFiltrados;

  // Navegación por pestañas
  readonly pestanaActiva = signal<TipoPestanaPanel>('metricas');

  // Ticket en atención activa para el cronómetro de la Pestaña 1
  readonly ticketEnAtencion = signal<TicketResumen | null>(null);

  // Modales de resolución y escalamiento
  readonly modalEscalarAbierto = signal<boolean>(false);
  readonly modalResolverAbierto = signal<boolean>(false);
  readonly procesandoAccion = signal<boolean>(false);
  readonly ticketParaAccion = signal<TicketResumen | null>(null);

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
    this.ticketParaAccion.set(ticket);
    this.modalResolverAbierto.set(true);
  }

  onEscalarTicket(ticket: TicketResumen): void {
    this.ticketParaAccion.set(ticket);
    this.modalEscalarAbierto.set(true);
  }

  get ticketIdNumerico(): number {
    const t = this.ticketParaAccion();
    return t ? Number(t.id) : 0;
  }

  confirmarEscalamiento(motivo: string): void {
    const t = this.ticketParaAccion();
    if (!t || this.procesandoAccion()) return;

    this.procesandoAccion.set(true);
    this.ticketsService.escalar(Number(t.id), motivo).subscribe({
      next: () => {
        this.procesandoAccion.set(false);
        this.modalEscalarAbierto.set(false);
        this.notificacion.exito('Ticket derivado al Nivel 2 (Especialista TI).');
        this.panelService.refrescarDatos();
      },
      error: () => {
        this.procesandoAccion.set(false);
        this.notificacion.error('No se pudo derivar el ticket. Intente nuevamente.');
      },
    });
  }

  confirmarResolucion(solucion: string): void {
    const t = this.ticketParaAccion();
    if (!t || this.procesandoAccion()) return;

    this.procesandoAccion.set(true);
    this.ticketsService.resolver(Number(t.id), solucion).subscribe({
      next: () => {
        this.procesandoAccion.set(false);
        this.modalResolverAbierto.set(false);
        this.notificacion.exito('Ticket resuelto exitosamente.');
        this.panelService.refrescarDatos();
      },
      error: () => {
        this.procesandoAccion.set(false);
        this.notificacion.error('No se pudo registrar la solución del ticket.');
      },
    });
  }

  refrescar(): void {
    this.panelService.refrescarDatos();
  }
}

