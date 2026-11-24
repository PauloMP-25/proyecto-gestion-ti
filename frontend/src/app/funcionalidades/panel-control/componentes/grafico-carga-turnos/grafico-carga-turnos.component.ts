import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PanelControlService } from '../../servicios/panel-control.service';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-grafico-carga-turnos',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './grafico-carga-turnos.component.html',
  styleUrl: './grafico-carga-turnos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoCargaTurnosComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasCargaTurnos') canvasCargaTurnos!: ElementRef<HTMLCanvasElement>;

  private panelService = inject(PanelControlService);
  private chartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      // Reaccionar a cambios en tiempo real en la base de datos de tickets
      const carga = this.panelService.cargaTurnosPorDia();
      if (this.chartInstance && carga) {
        this.actualizarGrafico();
      }
    });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.construirGrafico();
    });
  }

  private construirGrafico(): void {
    if (!this.canvasCargaTurnos) return;
    const ctx = this.canvasCargaTurnos.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const datos = this.panelService.cargaTurnosPorDia();
    const labels = datos.map(d => d.dia);
    const manana = datos.map(d => d.turnoManana);
    const tarde = datos.map(d => d.turnoTarde);

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Guardia Mañana (07:00 - 13:00)',
            data: manana,
            backgroundColor: '#701C1C', // Guinda institucional HSMSI
            borderColor: '#541414',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
          {
            label: 'Guardia Tarde (13:00 - 19:00)',
            data: tarde,
            backgroundColor: '#1B5E20', // Verde institucional
            borderColor: '#134718',
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
            categoryPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 2,
              useBorderRadius: true,
              color: '#334155',
              font: {
                family: "'Inter', system-ui, sans-serif",
                size: 11,
                weight: 600,
              },
            },
          },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#FFFFFF',
            bodyColor: '#F8FAFC',
            titleFont: { family: "'Inter', sans-serif", size: 12, weight: 'bold' },
            bodyFont: { family: "'Inter', sans-serif", size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw} tickets`,
              footer: (items) => {
                const totalDia = items.reduce((sum, item) => sum + (item.raw as number), 0);
                return `Total día: ${totalDia} incidentes`;
              },
            },
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#475569',
            font: {
              family: "'Inter', system-ui, sans-serif",
              size: 10,
              weight: 'bold',
            },
            formatter: (value: number) => (value > 0 ? value : ''),
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#475569',
              font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: '#E2E8F0' },
            ticks: {
              precision: 0,
              color: '#64748B',
              font: { family: "'Inter', sans-serif", size: 11 },
            },
          },
        },
      },
    });
  }

  private actualizarGrafico(): void {
    if (!this.chartInstance) {
      this.construirGrafico();
      return;
    }

    const datos = this.panelService.cargaTurnosPorDia();
    this.chartInstance.data.labels = datos.map(d => d.dia);
    this.chartInstance.data.datasets[0].data = datos.map(d => d.turnoManana);
    this.chartInstance.data.datasets[1].data = datos.map(d => d.turnoTarde);
    this.chartInstance.update();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
