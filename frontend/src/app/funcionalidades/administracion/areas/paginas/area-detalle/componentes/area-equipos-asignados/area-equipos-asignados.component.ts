import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TarjetaEquipoComponent } from '../../../../../../../compartido/ui/moleculas/tarjeta-equipo/tarjeta-equipo.component';

@Component({
  selector: 'app-area-equipos-asignados',
  standalone: true,
  imports: [TarjetaEquipoComponent],
  templateUrl: './area-equipos-asignados.component.html',
  styleUrl: './area-equipos-asignados.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaEquiposAsignadosComponent {
  readonly equipos = input.required<readonly any[]>();
  readonly tipo = input<'COMPUTADORA' | 'IMPRESORA'>('COMPUTADORA');
  readonly tituloBoton = input<string>('Registrar equipo');
  readonly mensajeVacio = input<string>('No hay equipos registrados en esta área.');

  readonly alRegistrar = output<void>();
}
