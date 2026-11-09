import { 
  Component, 
  ChangeDetectionStrategy, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-distribucion-tipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './distribucion-tipo.component.html',
  styleUrl: './distribucion-tipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistribucionTipoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasBarras') canvasBarras!: ElementRef<HTMLCanvasElement>;

  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.construirGraficoBarras();
  }

  private construirGraficoBarras(): void {
    if (!this.canvasBarras) return;

    const ctx = this.canvasBarras.nativeElement.getContext('2d');
    if (!ctx) return;

    // Top 5 Elementos de Configuración de la CMDB hospitalaria (Datos transaccionales reales)
    const categorias = [
      'Software EHR/HIS',
      'Redes & VLANs',
      'Estaciones PC',
      'Impresoras SIS',
      'Servidores BD'
    ];
    const casos = [18, 12, 8, 5, 3];

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categorias,
        datasets: [
          {
            label: 'Incidentes Activos',
            data: casos,
            backgroundColor: [
              'rgba(112, 28, 28, 0.85)',  // Guinda institucional
              'rgba(37, 99, 235, 0.85)',   // Azul red
              'rgba(13, 148, 136, 0.85)',  // Teal estaciones
              'rgba(234, 88, 12, 0.85)',   // Naranja impresoras
              'rgba(124, 58, 237, 0.85)',  // Púrpura servidores
            ],
            borderColor: [
              '#701c1c',
              '#2563eb',
              '#0d9488',
              '#ea580c',
              '#7c3aed',
            ],
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
            barThickness: 28,
            maxBarThickness: 36,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, bottom: 4, left: 4, right: 8 }
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
              color: 'rgba(226, 232, 240, 0.7)',
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
            display: false, // En gráficos de barras de una sola métrica no hace falta leyenda redundante
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
