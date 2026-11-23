import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';

export interface SolicitudCambioItem {
  id: string;
  codigo: string;
  titulo: string;
  areaAfectada: string;
  tipoCambio: 'Emergencia' | 'Estándar' | 'Planificado';
  estado: 'En evaluación' | 'Aprobado' | 'En implementación' | 'Completado';
  fechaProgramada: string;
  solicitante: string;
}

@Component({
  selector: 'app-cambios-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PlantillaPaginaComponent,
    IconoComponent,
    BotonComponent,
  ],
  templateUrl: './cambios-lista.page.html',
  styleUrls: ['./cambios-lista.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosListaPage {
  private readonly router = inject(Router);

  readonly solicitudes = signal<SolicitudCambioItem[]>([
    {
      id: '1',
      codigo: 'CHG-2026-001',
      titulo: 'Actualización del firmware en switch central de red',
      areaAfectada: 'Centro de Cómputo / Red troncal',
      tipoCambio: 'Planificado',
      estado: 'Aprobado',
      fechaProgramada: '28/11/2026 - 22:00 hrs',
      solicitante: 'Ing. Roberto Ramos',
    },
    {
      id: '2',
      codigo: 'CHG-2026-002',
      titulo: 'Mantenimiento preventivo en servidor de Admisión y Triaje',
      areaAfectada: 'Admisión Central y Triaje',
      tipoCambio: 'Estándar',
      estado: 'En evaluación',
      fechaProgramada: '30/11/2026 - 20:00 hrs',
      solicitante: 'Carlos Huamán (Soporte N1)',
    },
    {
      id: '3',
      codigo: 'CHG-2026-003',
      titulo: 'Reemplazo de fuente de poder en estación de Diagnóstico por Imágenes',
      areaAfectada: 'Diagnóstico por Imágenes',
      tipoCambio: 'Emergencia',
      estado: 'En implementación',
      fechaProgramada: '24/11/2026 - Inmediato',
      solicitante: 'Ing. Roberto Ramos',
    },
  ]);

  volverAlPanel(): void {
    this.router.navigate(['/panel-control']);
  }
}
