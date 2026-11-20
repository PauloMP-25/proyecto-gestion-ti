import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { AreaResumen } from '../../../../areas/modelos/areas.model';
import { EquipoItem } from '../../../modelos/equipos.model';

@Component({
  selector: 'app-selector-area-red',
  standalone: true,
  imports: [],
  templateUrl: './selector-area-red.component.html',
  styleUrl: './selector-area-red.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorAreaRedComponent {
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();
  readonly equipos = input.required<readonly EquipoItem[] | EquipoItem[]>();
  readonly areaSeleccionadaId = model<number | null>(null);

  readonly totalEquipos = computed(() => this.equipos().length);

  readonly conteoTotalIps = computed(() =>
    this.equipos().filter((eq) => !!eq.ipVigente).length
  );

  metricasArea(idArea: number): { total: number; conIp: number; sinIp: number } {
    const equiposArea = this.equipos().filter((eq) => eq.idArea === idArea);
    const conIp = equiposArea.filter((eq) => !!eq.ipVigente).length;
    return {
      total: equiposArea.length,
      conIp,
      sinIp: equiposArea.length - conIp,
    };
  }

  seleccionarArea(idArea: number | null): void {
    this.areaSeleccionadaId.set(idArea);
  }
}
