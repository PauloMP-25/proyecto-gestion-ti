import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiIndicador } from '../../../../funcionalidades/panel-control/modelos/kpi.model';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-kpi-tarjeta',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './kpi-tarjeta.component.html',
  styleUrl: './kpi-tarjeta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiTarjetaComponent {
  readonly kpi = input.required<KpiIndicador>();
  readonly mostrarFormula = signal<boolean>(false);

  toggleFormula(): void {
    this.mostrarFormula.update(v => !v);
  }

  cerrarFormula(): void {
    this.mostrarFormula.set(false);
  }
}
