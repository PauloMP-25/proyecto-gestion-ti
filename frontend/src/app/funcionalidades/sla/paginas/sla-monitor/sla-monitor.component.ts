import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SlaService } from '../../servicios/sla.service';
import { EstadoSla } from '../../../../compartido/modelos/estado-sla.enum';
import { PrioridadTicket } from '../../../../compartido/modelos/prioridad.enum';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';

@Component({
  selector: 'app-sla-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule, IconoComponent],
  templateUrl: './sla-monitor.component.html',
  styleUrl: './sla-monitor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlaMonitorComponent {
  private slaService = inject(SlaService);
  private router = inject(Router);

  readonly metricasGlobales = this.slaService.metricasGlobales;
  readonly cumplimientoPorArea = this.slaService.cumplimientoPorArea;
  readonly ticketsBajoMonitoreo = this.slaService.ticketsBajoMonitoreo;
  readonly reglasSla = this.slaService.reglasSla;

  readonly filtroEstadoSla = signal<string>('TODOS');

  irAConfiguracion(): void {
    this.router.navigate(['/sla/configuracion']);
  }

  obtenerClasePorcentaje(porcentajeConsumido: number): string {
    if (porcentajeConsumido >= 100) return 'progreso--incumplido';
    if (porcentajeConsumido >= 80) return 'progreso--alerta';
    return 'progreso--a-tiempo';
  }

  obtenerTextoEstado(estado: EstadoSla): string {
    switch (estado) {
      case EstadoSla.A_TIEMPO:
        return 'En Plazo';
      case EstadoSla.ALERTA:
        return 'Próximo a Vencer (≤ 20%)';
      case EstadoSla.INCUMPLIDO:
        return 'SLA Incumplido';
      default:
        return 'En Plazo';
    }
  }
}
