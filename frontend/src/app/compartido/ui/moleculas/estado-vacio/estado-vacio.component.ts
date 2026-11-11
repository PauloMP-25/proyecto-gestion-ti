import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-estado-vacio',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './estado-vacio.component.html',
  styleUrl: './estado-vacio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoVacioComponent {
  readonly mensaje = input<string>('No hay elementos para mostrar');
  readonly icono = input<string>('inbox');
}