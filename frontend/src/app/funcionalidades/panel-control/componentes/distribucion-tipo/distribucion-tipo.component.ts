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

// Registrar componentes de barras y datalabels en Chart.js
Chart.register(...registerables, ChartDataLabels);

export interface ActivoCMDB {
  elemento: string;
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

  private chartInstance: Chart | null = null;
  topSeleccionado: number = 5;

  // Catálogo de Elementos de Configuración de la CMDB Hospitalaria (Ordenados de mayor a menor)
  readonly activosCMDB: ActivoCMDB[] = [
    { elemento: 'Software EHR/HIS', casos: 18, color: '#701c1c' },
    { elemento: 'Redes & VLANs', casos: 12, color: '#2563eb' },
    { elemento: 'Estaciones PC', casos: 8, color: '#0d9488' },
    { elemento: 'Impresoras SIS', casos: 5, color: '#ea580c' },
    { elemento: 'Servidores BD', casos: 4, color: '#7c3aed' },
    { elemento: 'Telefonía IP', casos: 3, color: '#0284c7' },
    { elemento: 'Switches Core', casos: 3, color: '#059669' },
    { elemento: 'Lectoras Código', casos: 2, color: '#d97706' },
    { elemento: 'UPS / SAIs UCI', casos: 2, color: '#dc2626' },
    { elemento: 'Servidor PACS', casos: 1, color: '#4f46e5' },
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
    return {
      labels: seleccionados.map(a => a.elemento),
      casos: seleccionados.map(a => a.casos),
      colores: seleccionados.map(a => a.color),
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
              color: '#334155',
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
              color: 'rgba(226, 232, 240, 0.8)',
            },
            ticks: {
              stepSize: 5,
              color: '#64748b',
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
            backgroundColor: '#0b1c30',
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
            color: '#0f172a',
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
