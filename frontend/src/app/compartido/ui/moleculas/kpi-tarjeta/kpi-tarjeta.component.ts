import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
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

  /**
   * Símbolo formal de comparación relacional del KPI (≥, ≤, >, <, etc.)
   * según la definición específica de su meta objetivo.
   */
  readonly simboloComparador = computed(() => {
    const raw: string = this.kpi().comparador || '';
    if (raw === '>=' || raw === '≥') return '≥';
    if (raw === '<=' || raw === '≤') return '≤';
    if (raw === '↓') return '≤';
    return raw || '≥';
  });
}


