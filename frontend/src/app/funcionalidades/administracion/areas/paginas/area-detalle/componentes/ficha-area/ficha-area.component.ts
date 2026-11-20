import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AreaDetalle } from '../../../../modelos/areas.model';
import { DatoEtiquetadoComponent } from '../../../../../../../compartido/ui/moleculas/dato-etiquetado/dato-etiquetado.component';

@Component({
  selector: 'app-ficha-area',
  standalone: true,
  imports: [DatoEtiquetadoComponent],
  templateUrl: './ficha-area.component.html',
  styleUrl: './ficha-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaAreaComponent {
  readonly area = input.required<AreaDetalle>();
}
