import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';

export type TonoInsignia = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'info' | 'marca';
export type FormaInsignia = 'pildora' | 'cuadrada';

@Component({
  selector: 'app-insignia',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './insignia.component.html',
  styleUrl: './insignia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsigniaComponent {
  readonly texto = input.required<string>();
  readonly tono = input<TonoInsignia>('neutro');
  readonly forma = input<FormaInsignia>('pildora');
  readonly icono = input<string>();
}
