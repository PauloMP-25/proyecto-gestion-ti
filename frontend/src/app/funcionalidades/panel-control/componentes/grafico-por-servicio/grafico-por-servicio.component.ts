import { 
  Component, 
  ChangeDetectionStrategy, 
  inject, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy, 
  effect 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PanelControlService } from '../../servicios/panel-control.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes estándar de Chart.js y el plugin de etiquetas de datos
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-grafico-por-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grafico-por-servicio.component.html',
  styleUrl: './grafico-por-servicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoPorServicioComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasCircular') canvasCircular!: ElementRef<HTMLCanvasElement>;

  private panelService = inject(PanelControlService);
  private chartInstance: Chart | null = null;

  readonly periodo = this.panelService.periodoSeleccionado;
  periodoValor: 'hoy' | '7d' | '30d' = 'hoy';

  constructor() {
    effect(() => {
      // Re-renderizar si cambian los datos del servicio o el período
      const p = this.periodo();
      this.periodoValor = p;
      if (this.chartInstance) {
        this.actualizarGrafico();
      }
    });
  }

  ngAfterViewInit(): void {
    this.construirGrafico();
  }

  cambiarPeriodo(nuevoPeriodo: 'hoy' | '7d' | '30d'): void {
    this.panelService.periodoSeleccionado.set(nuevoPeriodo);
  }

  private obtenerDatosPorPeriodo() {
    // Datos hospitalarios reales de la base de datos ITIL v4 (Áreas Asistenciales)
    switch (this.periodo()) {
      case 'hoy':
        return {
          labels: [
            'Emergencia Adultos & Triaje',
            'UCI & Cuidados Críticos',
            'Centro Quirúrgico & Recuperación',
            'Laboratorio Clínico & Sangre',
            'Farmacia & Dispensación'
          ],
          valores: [26, 19, 14, 11, 8]
        };
      case '7d':
        return {
          labels: [
            'Emergencia Adultos & Triaje',
            'UCI & Cuidados Críticos',
            'Centro Quirúrgico & Recuperación',
            'Laboratorio Clínico & Sangre',
            'Farmacia & Dispensación'
          ],
          valores: [142, 98, 76, 54, 38]
        };
      case '30d':
        return {
          labels: [
            'Emergencia Adultos & Triaje',
            'UCI & Cuidados Críticos',
            'Centro Quirúrgico & Recuperación',
            'Laboratorio Clínico & Sangre',
            'Farmacia & Dispensación'
          ],
          valores: [520, 390, 285, 210, 145]
        };
    }
  }

  private construirGrafico(): void {
    if (!this.canvasCircular) return;

    const ctx = this.canvasCircular.nativeElement.getContext('2d');
    if (!ctx) return;

    const datos = this.obtenerDatosPorPeriodo();

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: datos.labels,
        datasets: [
          {
            data: datos.valores,
            backgroundColor: [
              '#701c1c', // Guinda MINSA
              '#ea580c', // Naranja clínico
              '#2563eb', // Azul asistencial
              '#0d9488', // Teal diagnóstico
              '#7c3aed', // Púrpura farmacia
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '52%',
        layout: {
          padding: { top: 6, bottom: 6, left: 4, right: 4 }
        },
        plugins: {
          legend: {
            position: 'right',
            align: 'center',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 3,
              useBorderRadius: true,
              padding: 10,
              color: '#1e293b',
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 11,
                weight: 600,
              },
              generateLabels: (chart) => {
                const data = chart.data;
                if (!data.labels?.length || !data.datasets.length) return [];
                const dataset = data.datasets[0];
                const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);

                return data.labels.map((label, i) => {
                  const val = dataset.data[i] as number;
                  const pct = Math.round((val / total) * 100);
                  const color = (dataset.backgroundColor as string[])[i];
                  return {
                    text: `${label} (${val} · ${pct}%)`,
                    fillStyle: color,
                    strokeStyle: color,
                    lineWidth: 0,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                });
              }
            }
          },
          tooltip: {
            backgroundColor: '#0b1c30',
            titleFont: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
            bodyFont: { family: "'Inter', sans-serif", size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (item) => {
                const val = item.raw as number;
                const total = (item.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = Math.round((val / total) * 100);
                return ` ${val} incidentes (${pct}% del total)`;
              }
            }
          },
          datalabels: {
            color: '#ffffff',
            font: {
              family: "'Inter', system-ui, sans-serif",
              weight: 'bold',
              size: 11
            },
            formatter: (value: number, context) => {
              const dataset = context.chart.data.datasets[0];
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              // Solo mostrar dentro de la porción si es mayor o igual a 8% para no amontonar
              return percentage >= 8 ? `${percentage}%` : '';
            }
          }
        }
      }
    });
  }

  private actualizarGrafico(): void {
    if (!this.chartInstance) return;
    const datos = this.obtenerDatosPorPeriodo();
    this.chartInstance.data.labels = datos.labels;
    this.chartInstance.data.datasets[0].data = datos.valores;
    this.chartInstance.update();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
