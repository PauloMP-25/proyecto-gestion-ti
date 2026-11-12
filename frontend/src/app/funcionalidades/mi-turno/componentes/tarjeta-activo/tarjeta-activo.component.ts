import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivoResumen } from '../../../../compartido/modelos/activo-resumen.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-tarjeta-activo',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './tarjeta-activo.component.html',
  styleUrls: ['./tarjeta-activo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaActivoComponent {
  readonly activo = input.required<ActivoResumen>();

  iconoPorTipo(tipo: string): string {
    switch (tipo) {
      case 'COMPUTADORA':
      case 'PC':
      case 'LAPTOP':
        return 'computer';
      case 'IMPRESORA':
        return 'print';
      case 'SERVIDOR':
        return 'dns';
      case 'SWITCH':
      case 'ROUTER':
      case 'RED':
        return 'router';
      case 'MEDICO':
        return 'monitor_heart';
      default:
        return 'devices';
    }
  }
}
