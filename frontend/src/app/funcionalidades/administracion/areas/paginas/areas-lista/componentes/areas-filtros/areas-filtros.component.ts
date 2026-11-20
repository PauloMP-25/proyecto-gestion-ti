import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { CampoFiltroComponent } from '../../../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';

@Component({
  selector: 'app-areas-filtros',
  standalone: true,
  imports: [CampoFiltroComponent],
  templateUrl: './areas-filtros.component.html',
  styleUrl: './areas-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasFiltrosComponent {
  readonly incluirInactivas = model<boolean>(false);
}
