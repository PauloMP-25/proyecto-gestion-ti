import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PrioridadMetrica {
  codigo: string;
  nombre: string;
  descripcion: string;
  casos: number;
  porcentaje: number;
  slaMaximo: string;
  colorClase: string;
}

@Component({
  selector: 'app-grafico-prioridades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafico-prioridades.component.html',
  styleUrl: './grafico-prioridades.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoPrioridadesComponent {
  readonly prioridades: PrioridadMetrica[] = [
    {
      codigo: 'P1',
      nombre: 'Crítica (STAT)',
      descripcion: 'Impacto Alto + Urgencia Alta (Servicio Vital UCI/Emergencia)',
      casos: 3,
      porcentaje: 12,
      slaMaximo: '≤ 60 min',
      colorClase: 'p1-critica',
    },
    {
      codigo: 'P2',
      nombre: 'Alta',
      descripcion: 'Impacto Alto + Urgencia Media (Degradación sin alternativa)',
      casos: 8,
      porcentaje: 31,
      slaMaximo: '≤ 120 min',
      colorClase: 'p2-alta',
    },
    {
      codigo: 'P3',
      nombre: 'Media',
      descripcion: 'Impacto Medio + Urgencia Media (Estación individual / Workaround)',
      casos: 11,
      porcentaje: 42,
      slaMaximo: '≤ 480 min',
      colorClase: 'p3-media',
    },
    {
      codigo: 'P4',
      nombre: 'Baja',
      descripcion: 'Impacto Bajo + Urgencia Baja (Solicitud / Requerimiento menor)',
      casos: 4,
      porcentaje: 15,
      slaMaximo: '≤ 1440 min',
      colorClase: 'p4-baja',
    },
  ];
}
