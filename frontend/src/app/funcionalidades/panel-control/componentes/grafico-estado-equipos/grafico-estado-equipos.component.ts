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
  selector: 'app-grafico-estado-equipos',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './grafico-estado-equipos.component.html',
  styleUrl: './grafico-estado-equipos.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficoEstadoEquiposComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasEquipos') canvasEquipos!: ElementRef<HTMLCanvasElement>;

  private panelService = inject(PanelControlService);
  private chartInstance: Chart | null = null;

  readonly estadoInventario = this.panelService.estadoInventario;

  constructor() {
    effect(() => {
      // Reaccionar a cambios en tiempo real en inventario o préstamos
      const inv = this.estadoInventario();
      if (this.chartInstance && inv) {
        this.actualizarGrafico();
      }
    });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.construirGrafico();
    });
  }

  readonly itemsLeyenda = () => {
    const inv = this.estadoInventario();
    const colores = [
      '#0F172A', // Slate institucional
      '#1B5E20', // Verde préstamo activo
      '#D97706', // Ámbar mantenimiento
      '#64748B', // Gris reserva de contingencia
    ];
    return [
      { estado: 'En servicio asistencial', total: inv.enServicio, color: colores[0] },
      { estado: 'En préstamo activo', total: inv.enPrestamo, color: colores[1] },
      { estado: 'En mantenimiento técnico', total: inv.enMantenimiento, color: colores[2] },
      { estado: 'Reserva de contingencia', total: inv.disponiblesReserva, color: colores[3] },
    ];
  };

  private construirGrafico(): void {
    if (!this.canvasEquipos) return;
    const ctx = this.canvasEquipos.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const inv = this.estadoInventario();
    const labels = [
      'En Servicio Asistencial',
      'En Préstamo Temporal Activo',
      'En Mantenimiento Técnico',
      'En Reserva de Contingencia',
    ];
    const valores = [
      inv.enServicio,
      inv.enPrestamo,
      inv.enMantenimiento,
      inv.disponiblesReserva,
    ];

    const colores = [
      '#0F172A', // Slate institucional
      '#1B5E20', // Verde préstamo activo
      '#D97706', // Ámbar mantenimiento
      '#64748B', // Gris reserva de contingencia
    ];

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: valores,
            backgroundColor: colores,
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '52%',
        layout: {
          padding: { top: 8, bottom: 8, left: 8, right: 8 },
        },
        plugins: {
          legend: {
            display: false,
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
              label: (item) => {
                const val = item.raw as number;
                const total = (item.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return ` ${item.label}: ${val} equipos (${pct}%)`;
              },
            },
          },
          datalabels: {
            color: '#FFFFFF',
            font: {
              family: "'Inter', system-ui, sans-serif",
              weight: 'bold',
              size: 11,
            },
            formatter: (value: number, context) => {
              const dataset = context.chart.data.datasets[0];
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return percentage >= 8 ? `${percentage}%` : '';
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

    const inv = this.estadoInventario();
    this.chartInstance.data.datasets[0].data = [
      inv.enServicio,
      inv.enPrestamo,
      inv.enMantenimiento,
      inv.disponiblesReserva,
    ];
    this.chartInstance.update();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
