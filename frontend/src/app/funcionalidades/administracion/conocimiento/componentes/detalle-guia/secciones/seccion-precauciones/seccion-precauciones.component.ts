import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AlertaEnLineaComponent } from '../../../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';

@Component({
  selector: 'app-seccion-precauciones',
  standalone: true,
  imports: [AlertaEnLineaComponent],
  templateUrl: './seccion-precauciones.component.html',
  styleUrl: './seccion-precauciones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionPrecaucionesComponent {
  readonly precauciones = input<readonly string[]>([]);
  readonly requiereTecnico = input<boolean>(false);
}
