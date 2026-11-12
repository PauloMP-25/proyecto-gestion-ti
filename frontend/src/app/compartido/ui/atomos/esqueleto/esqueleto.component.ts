import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type PresetEsqueleto = 'linea' | 'tarjeta-ticket' | 'tarjeta-solicitud' | 'fila-tabla' | 'articulo' | 'kpi';

@Component({
  selector: 'app-esqueleto',
  standalone: true,
  templateUrl: './esqueleto.component.html',
  styleUrl: './esqueleto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsqueletoComponent {
  readonly preset = input<PresetEsqueleto>('linea');
  readonly ancho = input<string>('100%');
  readonly alto = input<string>('1rem');
  readonly radio = input<string>('var(--radius-sm)');
}
