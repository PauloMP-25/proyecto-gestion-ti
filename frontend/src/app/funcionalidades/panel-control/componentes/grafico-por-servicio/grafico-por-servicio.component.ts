import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelControlService } from '../../servicios/panel-control.service';

export interface SegmentoCircular {
  servicio: string;
  casos: number;
  stat: number;
  porcentaje: number;
  color: string;
  strokeDasharray: string;
  strokeDashoffset: number;
}

const PALETA_SERVICIOS = [
  '#701c1c', // Guinda institucional (Emergencia)
  '#ea580c', // Naranja clínico (UCI)
  '#2563eb', // Azul médico (Quirófano)
  '#0d9488', // Teal asistencial (Laboratorio)
  '#7c3aed', // Púrpura farmacia (Farmacia)
];

const CIRCUNFERENCIA_DONUT = 2 * Math.PI * 65; // ~408.41 (radio 65)

@Component({
  selector: 'app-grafico-por-servicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grafico-por-servicio.component.html',
  styleUrl: './grafico-por-servicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoPorServicioComponent {
  private panelService = inject(PanelControlService);

  readonly tendencias = this.panelService.tendenciasPorServicio;
  readonly periodo = this.panelService.periodoSeleccionado;

  readonly totalIncidentes = computed(() => {
    return this.tendencias().reduce((acum, t) => acum + t.totalIncidentes, 0);
  });

  readonly segmentosDonut = computed<SegmentoCircular[]>(() => {
    const lista = this.tendencias().slice(0, 5); // Los 5 primeros
    const total = this.totalIncidentes();
    if (total === 0) return [];

    let offsetAcumulado = 0;

    return lista.map((item, index) => {
      const porcentaje = Math.round((item.totalIncidentes / total) * 100);
      const longitudArco = (item.totalIncidentes / total) * CIRCUNFERENCIA_DONUT;
      const dasharray = `${longitudArco} ${CIRCUNFERENCIA_DONUT}`;
      const dashoffset = -offsetAcumulado;

      offsetAcumulado += longitudArco;

      return {
        servicio: item.servicio,
        casos: item.totalIncidentes,
        stat: item.statIncidentes,
        porcentaje,
        color: PALETA_SERVICIOS[index % PALETA_SERVICIOS.length],
        strokeDasharray: dasharray,
        strokeDashoffset: dashoffset,
      };
    });
  });

  cambiarPeriodo(nuevoPeriodo: 'hoy' | '7d' | '30d'): void {
    this.panelService.periodoSeleccionado.set(nuevoPeriodo);
  }
}
