import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { EquipoItem } from '../../modelos/equipos.model';
import { SelectorAreaRedComponent } from './selector-area-red/selector-area-red.component';
import { ListaIpsAreaComponent } from './lista-ips-area/lista-ips-area.component';

@Component({
  selector: 'app-mapa-red',
  standalone: true,
  imports: [SelectorAreaRedComponent, ListaIpsAreaComponent],
  templateUrl: './mapa-red.component.html',
  styleUrl: './mapa-red.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaRedComponent {
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();
  readonly equipos = input.required<readonly EquipoItem[] | EquipoItem[]>();
  readonly areaSeleccionadaId = model<number | null>(null);

  readonly alEditarEquipo = output<EquipoItem>();
  readonly alRegistrarEquipo = output<void>();
}
