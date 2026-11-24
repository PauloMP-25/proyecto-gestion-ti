import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatoEtiquetadoComponent } from '../../../../../../../compartido/ui/moleculas/dato-etiquetado/dato-etiquetado.component';

@Component({
  selector: 'app-seccion-sintoma-causa',
  standalone: true,
  imports: [DatoEtiquetadoComponent],
  templateUrl: './seccion-sintoma-causa.component.html',
  styleUrl: './seccion-sintoma-causa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionSintomaCausaComponent {
  readonly sintoma = input.required<string>();
  readonly causa = input<string | null>(null);
}
