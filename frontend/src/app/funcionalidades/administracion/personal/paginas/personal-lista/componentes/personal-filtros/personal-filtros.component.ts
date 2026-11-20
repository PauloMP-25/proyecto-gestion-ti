import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { AreaResumen } from '../../../../../areas/modelos/areas.model';
import { CampoFiltroComponent, OpcionFiltro } from '../../../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';

@Component({
  selector: 'app-personal-filtros',
  standalone: true,
  imports: [CampoFiltroComponent],
  templateUrl: './personal-filtros.component.html',
  styleUrl: './personal-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalFiltrosComponent {
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();

  readonly area = model<number | null>(null);
  readonly rol = model<string | null>(null);

  readonly opcionesRol: readonly OpcionFiltro[] = [
    { valor: 'USUARIO_FINAL', etiqueta: 'Personal asistencial' },
    { valor: 'ADMINISTRADOR', etiqueta: 'Administrador de Mesa' },
  ];

  readonly opcionesArea = computed<readonly OpcionFiltro[]>(() =>
    this.areas().map((a) => ({
      valor: a.id,
      etiqueta: a.nombre,
    }))
  );
}
