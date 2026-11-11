import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialEntrada } from '../../../../compartido/modelos/ticket.model';
import { EstadoEtiquetaComponent } from '../../../../compartido/ui/atomos/estado-etiqueta/estado-etiqueta.component';

@Component({
  selector: 'app-incidente-linea-tiempo',
  imports: [CommonModule, EstadoEtiquetaComponent],
  templateUrl: './incidente-linea-tiempo.component.html',
  styleUrl: './incidente-linea-tiempo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteLineaTiempoComponent {
  readonly historial = input.required<HistorialEntrada[]>();
}