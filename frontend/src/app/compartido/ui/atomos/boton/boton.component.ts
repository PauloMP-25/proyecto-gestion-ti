import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../icono/icono.component';

export type VarianteBoton = 'primario' | 'secundario' | 'exito' | 'peligro' | 'outline' | 'fantasma';
export type TamanoBoton = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-boton',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './boton.component.html',
  styleUrl: './boton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonComponent {
  readonly variante = input<VarianteBoton>('primario');
  readonly tamano = input<TamanoBoton>('md');
  readonly tipo = input<'button' | 'submit' | 'reset'>('button');
  readonly deshabilitado = input<boolean>(false);
  readonly cargando = input<boolean>(false);
  readonly icono = input<string | undefined>(undefined);
  readonly iconoDerecha = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined);

  readonly alHacerClick = output<MouseEvent>();

  onClick(evento: MouseEvent): void {
    if (!this.deshabilitado() && !this.cargando()) {
      this.alHacerClick.emit(evento);
    }
  }
}
