import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';

export interface ColumnaTabla {
  readonly campo: string;
  readonly titulo: string;
  readonly ancho?: string;
  readonly alineacion?: 'izquierda' | 'centro' | 'derecha';
  readonly ocultarEnMovil?: boolean;
}

@Component({
  selector: 'app-tabla-administracion',
  standalone: true,
  imports: [CommonModule, BarraFiltrosComponent],
  templateUrl: './tabla-administracion.component.html',
  styleUrl: './tabla-administracion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaAdministracionComponent {
  readonly columnas = input.required<readonly ColumnaTabla[]>();
  readonly tituloAccesible = input<string>();
  readonly cargando = input<boolean>(false);
  readonly vacio = input<boolean>(false);
  readonly mensajeVacio = input<string>('No se encontraron registros.');
  readonly mostrarBuscador = input<boolean>(true);
  readonly placeholderBusqueda = input<string>('Buscar...');
  readonly tieneAcciones = input<boolean>(true);
  readonly filtrosActivos = input<number>(0);

  // model() expone automáticamente el input busqueda y el output busquedaChange
  readonly busqueda = model<string>('');
  readonly alLimpiarFiltros = output<void>();

  onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.alLimpiarFiltros.emit();
  }
}
