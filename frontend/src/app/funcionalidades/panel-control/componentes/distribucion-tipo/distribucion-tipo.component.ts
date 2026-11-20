import { 
  Component, 
  ChangeDetectionStrategy, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { leerToken, leerTokensNumerados } from '../../../../compartido/utilidades/tokens-css';

// Registrar componentes de barras y datalabels en Chart.js
Chart.register(...registerables, ChartDataLabels);

export interface ActivoCMDB {
  elemento: string;
  casos: number;
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

  private chartInstance: Chart | null = null;
  topSeleccionado: number = 5;

  // Catálogo de Elementos de Configuración (ordenados de mayor a menor).
  // El color de cada barra sale del token --comp-grafico-barras-N según su posición.
  readonly activosCMDB: ActivoCMDB[] = [
    { elemento: 'Software EHR/HIS', casos: 18 },
    { elemento: 'Redes & VLANs', casos: 12 },
    { elemento: 'Estaciones PC', casos: 8 },
    { elemento: 'Impresoras SIS', casos: 5 },
    { elemento: 'Servidores BD', casos: 4 },
    { elemento: 'Telefonía IP', casos: 3 },
    { elemento: 'Switches Core', casos: 3 },
    { elemento: 'Lectoras Código', casos: 2 },
    { elemento: 'UPS / SAIs UCI', casos: 2 },
    { elemento: 'Servidor PACS', casos: 1 },
  ];

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.construirGraficoBarras();
    });
  }

  cambiarTop(nuevoTop: number): void {
    this.topSeleccionado = Number(nuevoTop);
    this.actualizarGraficoBarras();
  }

  private obtenerDatosTop() {
    const seleccionados = this.activosCMDB.slice(0, this.topSeleccionado);
    const paleta = leerTokensNumerados('--comp-grafico-barras', this.activosCMDB.length);
    return {
      labels: seleccionados.map(a => a.elemento),
      casos: seleccionados.map(a => a.casos),
      colores: seleccionados.map((_, i) => paleta[i]),
    };
  }

  private actualizarGraficoBarras(): void {
    if (!this.chartInstance) {
      this.construirGraficoBarras();
      return;
    }

    const { labels, casos, colores } = this.obtenerDatosTop();
    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = casos;
    this.chartInstance.data.datasets[0].backgroundColor = colores;
    this.chartInstance.data.datasets[0].borderColor = colores;
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

    const { labels, casos, colores } = this.obtenerDatosTop();

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Incidentes Activos',
            data: casos,
            backgroundColor: colores,
            borderColor: colores,
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: this.topSeleccionado === 5 ? 28 : (this.topSeleccionado === 8 ? 22 : 18),
            maxBarThickness: 32,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 22, bottom: 4, left: 4, right: 8 }
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: leerToken('--comp-grafico-eje-x-texto'),
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 11,
                weight: 600,
              }
            }
          },
          y: {
            beginAtZero: true,
            suggestedMax: 22,
            grid: {
              color: leerToken('--comp-grafico-grilla'),
            },
            ticks: {
              stepSize: 5,
              color: leerToken('--comp-grafico-eje-y-texto'),
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 10,
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false, // En gráfico de barras con eje etiquetado no se necesita leyenda
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
              label: (item) => ` ${item.raw} incidentes registrados en CMDB`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            offset: 2,
            color: leerToken('--comp-grafico-etiqueta-texto'),
            font: {
              family: "'Inter', system-ui, sans-serif",
              weight: 'bold',
              size: 11,
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
