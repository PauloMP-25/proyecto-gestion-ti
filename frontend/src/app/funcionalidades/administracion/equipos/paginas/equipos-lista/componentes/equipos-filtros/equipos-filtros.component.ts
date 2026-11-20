import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { AreaResumen } from '../../../../../areas/modelos/areas.model';
import { CampoFiltroComponent, OpcionFiltro } from '../../../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';

@Component({
  selector: 'app-equipos-filtros',
  standalone: true,
  imports: [CampoFiltroComponent],
  templateUrl: './equipos-filtros.component.html',
  styleUrl: './equipos-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposFiltrosComponent {
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();

  readonly area = model<number | null>(null);
  readonly tipo = model<string | null>(null);
  readonly sinIp = model<boolean>(false);

  readonly opcionesTipo: readonly OpcionFiltro[] = [
    { valor: 'COMPUTADORA', etiqueta: 'Computadoras' },
    { valor: 'IMPRESORA', etiqueta: 'Impresoras' },
    { valor: 'OTRO', etiqueta: 'Otros' },
  ];

  readonly opcionesArea = computed<readonly OpcionFiltro[]>(() =>
    this.areas().map((a) => ({
      valor: a.id,
      etiqueta: a.nombre,
    }))
  );
}
