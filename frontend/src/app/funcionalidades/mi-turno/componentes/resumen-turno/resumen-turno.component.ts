import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResumenTurno } from '../../modelos/ticket-turno.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-resumen-turno',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './resumen-turno.component.html',
  styleUrls: ['./resumen-turno.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenTurnoComponent {
  readonly resumen = input.required<ResumenTurno>();
  readonly irAPorTomar = output<void>();

  onIrAPorTomar(): void {
    this.irAPorTomar.emit();
  }
}
