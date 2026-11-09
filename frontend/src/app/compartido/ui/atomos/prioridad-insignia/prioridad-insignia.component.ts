import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrioridadTicket } from '../../../modelos/prioridad.enum';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'app-prioridad-insignia',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './prioridad-insignia.component.html',
  styleUrl: './prioridad-insignia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrioridadInsigniaComponent {
  readonly prioridad = input.required<PrioridadTicket | 'P1' | 'P2' | 'P3' | 'P4'>();
  readonly compacto = input<boolean>(false);

  readonly config = computed(() => {
    switch (this.prioridad()) {
      case PrioridadTicket.P1:
      case 'P1':
        return {
          clase: 'prioridad--p1',
          icono: 'emergency',
          texto: 'P1 - Crítico',
          codigo: 'P1',
        };
      case PrioridadTicket.P2:
      case 'P2':
        return {
          clase: 'prioridad--p2',
          icono: 'warning',
          texto: 'P2 - Alto',
          codigo: 'P2',
        };
      case PrioridadTicket.P3:
      case 'P3':
        return {
          clase: 'prioridad--p3',
          icono: 'schedule',
          texto: 'P3 - Medio',
          codigo: 'P3',
        };
      case PrioridadTicket.P4:
      case 'P4':
      default:
        return {
          clase: 'prioridad--p4',
          icono: 'info',
          texto: 'P4 - Bajo',
          codigo: 'P4',
        };
    }
  });
}
