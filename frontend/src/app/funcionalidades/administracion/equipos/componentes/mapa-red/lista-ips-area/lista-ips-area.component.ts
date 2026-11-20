import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AreaResumen } from '../../../../areas/modelos/areas.model';
import { EquipoItem } from '../../../modelos/equipos.model';
import { EtiquetaIpComponent } from '../../../../../../compartido/ui/atomos/etiqueta-ip/etiqueta-ip.component';

@Component({
  selector: 'app-lista-ips-area',
  standalone: true,
  imports: [EtiquetaIpComponent],
  templateUrl: './lista-ips-area.component.html',
  styleUrl: './lista-ips-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaIpsAreaComponent {
  readonly equipos = input.required<readonly EquipoItem[] | EquipoItem[]>();
  readonly areaSeleccionadaId = input<number | null>(null);
  readonly areas = input<readonly AreaResumen[] | AreaResumen[]>([]);

  readonly alEditar = output<EquipoItem>();
  readonly alRegistrar = output<void>();

  readonly areaNombre = computed(() => {
    const id = this.areaSeleccionadaId();
    if (id === null) return null;
    const a = this.areas().find((item) => item.id === id);
    return a ? a.nombre : null;
  });

  readonly equiposFiltrados = computed(() => {
    const idArea = this.areaSeleccionadaId();
    const todos = this.equipos();
    if (idArea === null) return todos;
    return todos.filter((eq) => eq.idArea === idArea);
  });

  readonly equiposConIp = computed(() =>
    this.equiposFiltrados().filter((eq) => !!eq.ipVigente)
  );

  readonly equiposSinIp = computed(() =>
    this.equiposFiltrados().filter((eq) => !eq.ipVigente)
  );
}
