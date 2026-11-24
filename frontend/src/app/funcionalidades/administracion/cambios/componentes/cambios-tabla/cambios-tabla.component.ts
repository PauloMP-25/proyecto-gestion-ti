import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InsigniaComponent } from '../../../../../compartido/ui/atomos/insignia/insignia.component';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { CambioResumen } from '../../modelos/cambios.model';
import {
  ETIQUETA_CATEGORIA,
  PRESENTACION_ESTADO,
  PRESENTACION_IMPACTO,
  PRESENTACION_TIPO,
} from '../../utilidades/etiquetas-cambio';

@Component({
  selector: 'app-cambios-tabla',
  standalone: true,
  imports: [DatePipe, InsigniaComponent, BotonIconoComponent],
  templateUrl: './cambios-tabla.component.html',
  styleUrl: './cambios-tabla.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosTablaComponent {
  readonly cambios = input.required<readonly CambioResumen[]>();

  readonly alSeleccionar = output<number>();

  protected readonly ETIQUETA_CATEGORIA = ETIQUETA_CATEGORIA;
  protected readonly PRESENTACION_ESTADO = PRESENTACION_ESTADO;
  protected readonly PRESENTACION_IMPACTO = PRESENTACION_IMPACTO;
  protected readonly PRESENTACION_TIPO = PRESENTACION_TIPO;

  protected resumenAreas(areas: readonly string[]): string {
    const visibles = areas.slice(0, 2);
    const resto = areas.length - visibles.length;
    return resto > 0 ? `${visibles.join(', ')} +${resto}` : visibles.join(', ');
  }

  protected seleccionar(evento: Event, id: number): void {
    evento.stopPropagation();
    this.alSeleccionar.emit(id);
  }
}
