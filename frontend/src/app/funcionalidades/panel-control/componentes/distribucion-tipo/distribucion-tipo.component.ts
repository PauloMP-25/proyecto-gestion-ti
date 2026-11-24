import { 
  Component, 
  ChangeDetectionStrategy, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy,
  inject,
  effect,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PanelControlService } from '../../servicios/panel-control.service';
import { leerToken, leerTokensNumerados } from '../../../../compartido/utilidades/tokens-css';

// Registrar componentes de barras y datalabels en Chart.js
Chart.register(...registerables, ChartDataLabels);

export interface ItemTopEquipo {
  categoria: string;
  casos: number;
  color: string;
}

@Component({
  selector: 'app-distribucion-tipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './distribucion-tipo.component.html',
  styleUrl: './distribucion-tipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistribucionTipoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasBarras') canvasBarras!: ElementRef<HTMLCanvasElement>;

  private panelService = inject(PanelControlService);
  private chartInstance: Chart | null = null;
  readonly topSeleccionado = signal<number>(5);

  readonly datosTop = computed(() => {
    const distribucion = this.panelService.distribucionPorTipo();
    const top = this.topSeleccionado();
    const seleccionados = distribucion.slice(0, top);
    const paleta = leerTokensNumerados('--comp-grafico-barras', Math.max(seleccionados.length, 5));

    const items: ItemTopEquipo[] = seleccionados.map((d, i) => ({
      categoria: d.categoria,
      casos: d.casos,
      color: paleta[i % paleta.length],
    }));

    return {
      labels: items.map(it => it.categoria),
      rankingLabels: items.map((_, i) => `#${i + 1}`),
      casos: items.map(it => it.casos),
      colores: items.map(it => it.color),
      items,
    };
  });

  constructor() {
    effect(() => {
      // Re-renderizar si cambian los tickets o el TOP seleccionado
      const datos = this.datosTop();
      if (this.chartInstance) {
        this.actualizarGraficoBarras(datos);
      }
    });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.construirGraficoBarras();
    });
  }

  cambiarTop(nuevoTop: number): void {
    this.topSeleccionado.set(Number(nuevoTop));
  }

  private actualizarGraficoBarras(datos = this.datosTop()): void {
    if (!this.chartInstance) {
      this.construirGraficoBarras();
      return;
    }

    this.chartInstance.data.labels = datos.rankingLabels;
    this.chartInstance.data.datasets[0].data = datos.casos;
    this.chartInstance.data.datasets[0].backgroundColor = datos.colores;
    this.chartInstance.data.datasets[0].borderColor = datos.colores;
    (this.chartInstance.data.datasets[0] as any).barThickness =
      this.topSeleccionado() === 5 ? 24 : (this.topSeleccionado() === 8 ? 18 : 14);
    this.chartInstance.update();
  }

  private construirGraficoBarras(): void {
    if (!this.canvasBarras) return;

    const ctx = this.canvasBarras.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const datos = this.datosTop();

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datos.rankingLabels,
        datasets: [
          {
            label: 'Incidentes Activos',
            data: datos.casos,
            backgroundColor: datos.colores,
            borderColor: datos.colores,
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: this.topSeleccionado() === 5 ? 24 : (this.topSeleccionado() === 8 ? 18 : 14),
            maxBarThickness: 28,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 6, bottom: 6, left: 4, right: 28 }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: leerToken('--comp-grafico-grilla'),
            },
            ticks: {
              precision: 0,
              color: leerToken('--comp-grafico-eje-x-texto'),
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 11,
                weight: 600,
              }
            }
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: leerToken('--comp-grafico-eje-y-texto'),
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 12,
                weight: 700,
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false, // La leyenda completa está al lado derecho en HTML accesible
          },
          tooltip: {
            backgroundColor: leerToken('--comp-grafico-tooltip-bg'),
            titleColor: leerToken('--comp-grafico-tooltip-texto'),
            bodyColor: leerToken('--comp-grafico-tooltip-texto'),
            titleFont: { family: "'Inter', sans-serif", size: 13, weight: 'bold' },
            bodyFont: { family: "'Inter', sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                return this.datosTop().items[idx]?.categoria || '';
              },
              label: (item) => ` ${item.raw} ${item.raw === 1 ? 'incidente' : 'incidentes'} registrados`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'right',
            offset: 4,
            color: leerToken('--comp-grafico-etiqueta-texto'),
            font: {
              family: "'Inter', system-ui, sans-serif",
              weight: 'bold',
              size: 12,
            },
            formatter: (value: number) => `${value}`
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}

