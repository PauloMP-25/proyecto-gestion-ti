import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoTicket, EstadoTicketEtiquetas } from '../../../modelos/estado-ticket.enum';

@Component({
  selector: 'app-estado-etiqueta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estado-etiqueta.component.html',
  styleUrl: './estado-etiqueta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadoEtiquetaComponent {
  readonly estado = input.required<EstadoTicket | keyof typeof EstadoTicket | string>();

  readonly etiqueta = computed(() => {
    const est = this.estado() as EstadoTicket;
    return EstadoTicketEtiquetas[est] ?? est;
  });

  readonly claseCss = computed(() => {
    switch (this.estado()) {
      case EstadoTicket.NUEVO:
        return 'estado--nuevo';
      case EstadoTicket.ASIGNADO:
        return 'estado--asignado';
      case EstadoTicket.EN_PROCESO:
        return 'estado--en-proceso';
      case EstadoTicket.ESCALADO:
        return 'estado--escalado';
      case EstadoTicket.RESUELTO:
        return 'estado--resuelto';
      case EstadoTicket.CERRADO:
        return 'estado--cerrado';
      case EstadoTicket.REABIERTO:
        return 'estado--reabierto';
      default:
        return 'estado--default';
    }
  });
}
