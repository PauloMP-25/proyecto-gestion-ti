import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';

export interface CeldaMatriz {
  impacto: 'Alto' | 'Medio' | 'Bajo';
  urgencia: 'Alta' | 'Media' | 'Baja';
  prioridad: 'P1' | 'P2' | 'P3' | 'P4';
  nombre: string;
}

export interface ReglaSLA {
  prioridad: 'P1' | 'P2' | 'P3' | 'P4';
  nombre: string;
  tiempoRespuestaMin: number;
  tiempoResolucionMin: number;
  colorClase: string;
  aplicaHorarioLaboral: boolean;
  notificarJefaturaMin: number;
}

@Component({
  selector: 'app-sla-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconoComponent, BotonComponent],
  templateUrl: './sla-configuracion.component.html',
  styleUrl: './sla-configuracion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlaConfiguracionComponent {
  private router = inject(Router);

  guardadoExitoso = signal<boolean>(false);

  // Matriz 3x3 ITIL v4 Impacto x Urgencia
  readonly matriz: CeldaMatriz[][] = [
    [
      { impacto: 'Alto', urgencia: 'Alta', prioridad: 'P1', nombre: 'Crítica (STAT)' },
      { impacto: 'Alto', urgencia: 'Media', prioridad: 'P2', nombre: 'Alta' },
      { impacto: 'Alto', urgencia: 'Baja', prioridad: 'P3', nombre: 'Media' },
    ],
    [
      { impacto: 'Medio', urgencia: 'Alta', prioridad: 'P2', nombre: 'Alta' },
      { impacto: 'Medio', urgencia: 'Media', prioridad: 'P3', nombre: 'Media' },
      { impacto: 'Medio', urgencia: 'Baja', prioridad: 'P4', nombre: 'Baja' },
    ],
    [
      { impacto: 'Bajo', urgencia: 'Alta', prioridad: 'P3', nombre: 'Media' },
      { impacto: 'Bajo', urgencia: 'Media', prioridad: 'P4', nombre: 'Baja' },
      { impacto: 'Bajo', urgencia: 'Baja', prioridad: 'P4', nombre: 'Baja' },
    ],
  ];

  // Acuerdos de Nivel de Servicio pactados con el Hospital
  readonly reglasSLA: ReglaSLA[] = [
    {
      prioridad: 'P1',
      nombre: 'Crítica (STAT)',
      tiempoRespuestaMin: 15,
      tiempoResolucionMin: 60,
      colorClase: 'p1-critica',
      aplicaHorarioLaboral: false, // 24/7 sin excepción
      notificarJefaturaMin: 20,
    },
    {
      prioridad: 'P2',
      nombre: 'Alta',
      tiempoRespuestaMin: 30,
      tiempoResolucionMin: 120,
      colorClase: 'p2-alta',
      aplicaHorarioLaboral: false,
      notificarJefaturaMin: 45,
    },
    {
      prioridad: 'P3',
      nombre: 'Media',
      tiempoRespuestaMin: 60,
      tiempoResolucionMin: 480,
      colorClase: 'p3-media',
      aplicaHorarioLaboral: true,
      notificarJefaturaMin: 120,
    },
    {
      prioridad: 'P4',
      nombre: 'Baja',
      tiempoRespuestaMin: 120,
      tiempoResolucionMin: 1440,
      colorClase: 'p4-baja',
      aplicaHorarioLaboral: true,
      notificarJefaturaMin: 360,
    },
  ];

  volverAlPanel(): void {
    this.router.navigate(['/panel-control']);
  }

  guardarConfiguracion(): void {
    this.guardadoExitoso.set(true);
    setTimeout(() => {
      this.guardadoExitoso.set(false);
    }, 4000);
  }
}
