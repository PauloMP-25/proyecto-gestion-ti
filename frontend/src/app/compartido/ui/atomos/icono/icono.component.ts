import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type TamanoIcono = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-icono',
  standalone: true,
  templateUrl: './icono.component.html',
  styleUrl: './icono.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconoComponent {
  readonly nombre = input.required<string>();
  readonly tamano = input<TamanoIcono>('md');
  readonly etiqueta = input<string | undefined>(undefined);
  readonly relleno = input<boolean>(false);
}
