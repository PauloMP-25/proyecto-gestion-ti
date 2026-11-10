import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { ChipFiltroComponent } from '../../atomos/chip-filtro/chip-filtro.component';

export interface FiltroOpcion {
  id: string;
  etiqueta: string;
  conteo?: number;
  icono?: string;
}

@Component({
  selector: 'app-buscador-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoComponent, ChipFiltroComponent],
  templateUrl: './buscador-filtros.component.html',
  styleUrl: './buscador-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorFiltrosComponent {
  readonly placeholder = input<string>('Buscar por código, asunto, área o IP...');
  readonly opcionesFiltro = input<FiltroOpcion[]>([]);
  readonly filtroActivoId = input<string>('todos');

  readonly alBuscar = output<string>();
  readonly alSeleccionarFiltro = output<string>();

  busquedaTexto = '';

  onInput(): void {
    this.alBuscar.emit(this.busquedaTexto.trim());
  }

  onSeleccionarChip(id: string): void {
    this.alSeleccionarFiltro.emit(id);
  }
}
