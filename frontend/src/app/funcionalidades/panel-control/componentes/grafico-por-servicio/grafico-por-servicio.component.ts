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
import { leerToken, leerTokensNumerados } from '../../../../compartido/utilidades/tokens-css';

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
      // Re-renderizar reactivamente cuando cambien los datos de tickets en la base de datos
      const tendencias = this.panelService.tendenciasPorServicio();
      const p = this.periodo();
      this.periodoValor = p;
      if (this.chartInstance && tendencias) {
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
    const tendencias = this.panelService.tendenciasPorServicio();
    if (tendencias && tendencias.length > 0) {
      return {
        labels: tendencias.map(t => t.servicio),
        valores: tendencias.map(t => t.totalIncidentes),
      };
    }

    return {
      labels: [],
      valores: [],
    };
  }

  readonly itemsLeyenda = () => {
    const tendencias = this.panelService.tendenciasPorServicio();
    const colores = leerTokensNumerados('--comp-grafico-dona', 5);
    if (!tendencias || tendencias.length === 0) return [];
    return tendencias.map((t, i) => ({
      servicio: t.servicio,
      totalIncidentes: t.totalIncidentes,
      color: colores[i % colores.length]
    }));
  };

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
            backgroundColor: leerTokensNumerados('--comp-grafico-dona', 5),
            borderColor: leerToken('--comp-grafico-segmento-borde'),
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
          padding: { top: 8, bottom: 8, left: 8, right: 8 }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: leerToken('--comp-grafico-tooltip-bg'),
            titleColor: leerToken('--comp-grafico-tooltip-texto'),
            bodyColor: leerToken('--comp-grafico-tooltip-texto'),
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
            color: leerToken('--comp-grafico-etiqueta-sobre-segmento'),
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
