import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';

export type VarianteBotonIcono = 'fantasma' | 'suave' | 'peligro';
export type TamanoBotonIcono = 'sm' | 'md';

@Component({
  selector: 'app-boton-icono',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './boton-icono.component.html',
  styleUrl: './boton-icono.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonIconoComponent {
  readonly icono = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly variante = input<VarianteBotonIcono>('fantasma');
  readonly tamano = input<TamanoBotonIcono>('md');
  readonly deshabilitado = input<boolean>(false);

  readonly alHacerClick = output<MouseEvent>();
}
