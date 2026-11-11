import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

export interface SlaEstadoDesglose {
  estado: string;
  etiqueta: string;
  casos: number;
  porcentaje: number;
  icono: string;
  colorClase: string;
  descripcion: string;
}

@Component({
  selector: 'app-grafico-sla-cumplimiento',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './grafico-sla-cumplimiento.component.html',
  styleUrl: './grafico-sla-cumplimiento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoSlaCumplimientoComponent {
  readonly desgloses: SlaEstadoDesglose[] = [
    {
      estado: 'A_TIEMPO',
      etiqueta: 'Dentro de SLA (En norma)',
      casos: 20,
      porcentaje: 77,
      icono: 'check_circle',
      colorClase: 'ok',
      descripcion: 'Atención normal dentro del umbral pactado con el área médica.',
    },
    {
      estado: 'ALERTA',
      etiqueta: 'En Riesgo (<20% tiempo restante)',
      casos: 4,
      porcentaje: 15,
      icono: 'warning',
      colorClase: 'alerta',
      descripcion: 'Tickets próximos a vencer; requieren atención o escalamiento inmediato.',
    },
    {
      estado: 'INCUMPLE',
      etiqueta: 'Incumplido (SLA Vencido)',
      casos: 2,
      porcentaje: 8,
      icono: 'cancel',
      colorClase: 'vencido',
      descripcion: 'Superaron la ventana límite de resolución técnica pactada.',
    },
  ];
}
