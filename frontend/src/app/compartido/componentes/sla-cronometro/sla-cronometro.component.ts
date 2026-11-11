import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../../ui/atomos/icono/icono.component';
import { SlaCalculado } from '../../modelos/sla-vista.model';
import { EstadoSla } from '../../modelos/estado-sla.enum';

@Component({
  selector: 'app-sla-cronometro',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sla-cronometro.component.html',
  styleUrl: './sla-cronometro.component.scss',
})
export class SlaCronometroComponent {
  readonly sla = input.required<SlaCalculado>();
  readonly compacto = input<boolean>(false);

  readonly icono = computed(() => {
    switch (this.sla().estado) {
      case EstadoSla.A_TIEMPO:
        return 'check_circle';
      case EstadoSla.ALERTA:
        return 'hourglass_empty';
      case EstadoSla.INCUMPLIDO:
        return 'warning';
      default:
        return 'schedule';
    }
  });

  readonly textoEstado = computed(() => {
    switch (this.sla().estado) {
      case EstadoSla.A_TIEMPO:
        return 'A tiempo';
      case EstadoSla.ALERTA:
        return 'Por vencer';
      case EstadoSla.INCUMPLIDO:
        return 'Vencido';
      default:
        return 'SLA';
    }
  });

  readonly porcentaje = computed(() => Math.round(this.sla().porcentajeRestante * 100));

  readonly etiquetaAccesible = computed(() => {
    const s = this.sla();
    if (s.fase === 'COMPLETADO') {
      return 'Compromiso de atención completado';
    }
    return s.estado === EstadoSla.INCUMPLIDO
      ? `Vencido. ${s.texto}`
      : `${this.textoEstado()}. Tiempo restante ${s.texto}`;
  });
}
