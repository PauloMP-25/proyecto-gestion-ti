import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelControlService } from '../../servicios/panel-control.service';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-grafico-por-servicio',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './grafico-por-servicio.component.html',
  styleUrl: './grafico-por-servicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoPorServicioComponent {
  private panelService = inject(PanelControlService);

  readonly tendencias = this.panelService.tendenciasPorServicio;
  readonly periodo = this.panelService.periodoSeleccionado;

  cambiarPeriodo(nuevoPeriodo: 'hoy' | '7d' | '30d'): void {
    this.panelService.periodoSeleccionado.set(nuevoPeriodo);
  }
}
