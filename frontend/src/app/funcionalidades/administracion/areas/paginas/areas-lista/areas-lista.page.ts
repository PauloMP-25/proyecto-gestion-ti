import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AreasStore } from '../../estado/areas.store';
import { AreaDetalle, AreaResumen } from '../../modelos/areas.model';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { AreasTablaComponent } from './componentes/areas-tabla/areas-tabla.component';
import { AreasFiltrosComponent } from './componentes/areas-filtros/areas-filtros.component';
import { DialogoAreaComponent } from '../../componentes/dialogo-area/dialogo-area.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-areas-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    AreasTablaComponent,
    AreasFiltrosComponent,
    DialogoAreaComponent,
    DialogoConfirmacionComponent,
  ],
  templateUrl: './areas-lista.page.html',
  styleUrl: './areas-lista.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasListaPage implements OnInit {
  readonly store = inject(AreasStore);
  private readonly router = inject(Router);

  readonly textoBusqueda = signal<string>('');
  readonly incluirInactivas = signal<boolean>(false);

  readonly modalAbierto = signal<boolean>(false);
  readonly areaParaEditar = signal<AreaDetalle | null>(null);
  readonly areaParaCambiarEstado = signal<AreaResumen | null>(null);

  ngOnInit(): void {
    this.store.cargar();
  }

  alCambiarBusqueda(valor: string): void {
    this.textoBusqueda.set(valor);
    this.store.cargar({ buscar: valor });
  }

  alCambiarInactivas(valor: boolean): void {
    this.incluirInactivas.set(valor);
    this.store.cargar({ incluirInactivas: valor });
  }

  verDetalle(id: number): void {
    this.router.navigate(['/administracion/areas', id]);
  }

  abrirModalNuevaArea(): void {
    this.areaParaEditar.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(area: AreaResumen): void {
    const detalle: AreaDetalle = {
      ...area,
      referenciaUbicacion: null,
    };
    this.areaParaEditar.set(detalle);
    this.modalAbierto.set(true);
  }

  alCerrarModal(_recargar: boolean): void {
    this.modalAbierto.set(false);
    this.areaParaEditar.set(null);
  }

  confirmarCambioEstado(area: AreaResumen): void {
    this.areaParaCambiarEstado.set(area);
  }

  ejecutarCambioEstado(): void {
    const area = this.areaParaCambiarEstado();
    if (!area) return;

    this.store.cambiarEstado(area.id, !area.activo).subscribe({
      next: () => this.areaParaCambiarEstado.set(null),
      error: () => this.areaParaCambiarEstado.set(null),
    });
  }

  cancelarCambioEstado(): void {
    this.areaParaCambiarEstado.set(null);
  }
}
