import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { InsigniaComponent } from '../../atomos/insignia/insignia.component';

export interface Pestana<T extends string = string> {
  id: T;
  etiqueta: string;
  icono?: string;
  conteo?: number | string;
  conteoDestacado?: boolean;
  deshabilitada?: boolean;
}

@Component({
  selector: 'app-barra-pestanas',
  standalone: true,
  imports: [IconoComponent, InsigniaComponent],
  templateUrl: './barra-pestanas.component.html',
  styleUrl: './barra-pestanas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraPestanasComponent {
  protected readonly String = String;

  readonly pestanas = input.required<readonly Pestana[]>();
  readonly activa = model.required<string>();
  readonly etiquetaAccesible = input.required<string>();

  seleccionar(pestana: Pestana): void {
    if (!pestana.deshabilitada && this.activa() !== pestana.id) {
      this.activa.set(pestana.id);
    }
  }

  manejarTeclado(event: KeyboardEvent, indexActual: number): void {
    const lista = this.pestanas();
    let siguienteIndex = indexActual;

    if (event.key === 'ArrowRight') {
      siguienteIndex = (indexActual + 1) % lista.length;
    } else if (event.key === 'ArrowLeft') {
      siguienteIndex = (indexActual - 1 + lista.length) % lista.length;
    } else if (event.key === 'Home') {
      siguienteIndex = 0;
    } else if (event.key === 'End') {
      siguienteIndex = lista.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const item = lista[siguienteIndex];
    if (item && !item.deshabilitada) {
      this.seleccionar(item);
    }
  }
}
