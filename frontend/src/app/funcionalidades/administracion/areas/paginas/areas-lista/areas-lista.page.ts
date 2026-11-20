import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AreasStore } from '../../estado/areas.store';
import { AreaDetalle, AreaResumen } from '../../modelos/areas.model';
import {
  ColumnaTabla,
  TablaAdministracionComponent,
} from '../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { DialogoAreaComponent } from '../../componentes/dialogo-area/dialogo-area.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-areas-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TablaAdministracionComponent,
    DialogoAreaComponent,
    DialogoConfirmacionComponent,
  ],
  template: `
    <div class="pagina-areas">
      <header class="pagina-areas__cabecera">
        <div>
          <h1 class="pagina-areas__titulo">Áreas del hospital</h1>
          <p class="pagina-areas__subtitulo">
            Registre y gestione las áreas hospitalarias, pisos, anexos telefónicos y asignación de encargados.
          </p>
        </div>
        <button
          type="button"
          class="btn-nuevo"
          (click)="abrirModalNuevaArea()"
          aria-label="Registrar nueva área hospitalaria"
        >
          <span class="icono-btn" aria-hidden="true">add</span>
          <span>Nueva área</span>
        </button>
      </header>

      <app-tabla-administracion
        [columnas]="columnas"
        tituloAccesible="Listado de áreas hospitalarias"
        [cargando]="store.cargando()"
        [vacio]="store.vacio()"
        mensajeVacio="Aún no hay áreas registradas. Empiece por Admisión y Emergencia."
        placeholderBusqueda="Buscar área por nombre..."
        [busqueda]="textoBusqueda()"
        (busquedaChange)="alCambiarBusqueda($event)"
      >
        <div filtros class="filtro-inactivas">
          <label class="check-label">
            <input
              type="checkbox"
              [ngModel]="incluirInactivas()"
              (ngModelChange)="alCambiarInactivas($event)"
            />
            <span>Mostrar inactivas</span>
          </label>
        </div>

        <button
          accion-vacio
          type="button"
          class="btn-nuevo btn-nuevo--sm"
          (click)="abrirModalNuevaArea()"
        >
          <span class="icono-btn" aria-hidden="true">add</span>
          <span>Registrar primera área</span>
        </button>

        <ng-container filas>
          @for (area of store.areas(); track area.id) {
            <tr
              class="fila-area"
              [class.fila-area--inactiva]="!area.activo"
              (click)="verDetalle(area.id)"
              tabindex="0"
              (keydown.enter)="verDetalle(area.id)"
              role="button"
              [attr.aria-label]="'Ver detalle del área ' + area.nombre"
            >
              <td>
                <div class="celda-nombre">
                  <span class="nombre-area">{{ area.nombre }}</span>
                  @if (!area.activo) {
                    <span class="badge-inactiva">Inactiva</span>
                  }
                </div>
              </td>
              <td>{{ area.ubicacionLegible }}</td>
              <td>
                @if (area.anexo) {
                  <span class="celda-anexo">
                    <span class="icono-anexo" aria-hidden="true">call</span>
                    <span>{{ area.anexo }}</span>
                  </span>
                } @else {
                  <span class="texto-apagado">—</span>
                }
              </td>
              <td>
                @if (area.encargado) {
                  <span class="nombre-encargado">{{ area.encargado.nombreVisible }}</span>
                } @else {
                  <span class="texto-apagado">Sin encargado asignado</span>
                }
              </td>
              <td>
                <span
                  class="badge-equipos"
                  [title]="area.totalComputadoras + ' computadoras · ' + area.totalImpresoras + ' impresoras en red'"
                  [attr.aria-label]="area.totalComputadoras + ' computadoras y ' + area.totalImpresoras + ' impresoras'"
                >
                  <span class="icono-equipo" aria-hidden="true">devices</span>
                  <span>{{ area.totalComputadoras }} · {{ area.totalImpresoras }}</span>
                </span>
              </td>
              <td class="text-right" (click)="$event.stopPropagation()">
                <div class="acciones-fila">
                  <button
                    type="button"
                    class="btn-accion"
                    [attr.aria-label]="'Editar área ' + area.nombre"
                    (click)="abrirModalEditar(area)"
                    title="Editar área"
                  >
                    <span class="icono-accion" aria-hidden="true">edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-accion"
                    [class.btn-accion--reactivar]="!area.activo"
                    [attr.aria-label]="(area.activo ? 'Desactivar' : 'Reactivar') + ' área ' + area.nombre"
                    (click)="confirmarCambioEstado(area)"
                    [title]="area.activo ? 'Desactivar área' : 'Reactivar área'"
                  >
                    <span class="icono-accion" aria-hidden="true">
                      {{ area.activo ? 'block' : 'check_circle' }}
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </ng-container>
      </app-tabla-administracion>

      @if (modalAbierto()) {
        <app-dialogo-area
          [areaParaEditar]="areaParaEditar()"
          (cerrado)="alCerrarModal($event)"
        ></app-dialogo-area>
      }

      @if (areaParaCambiarEstado()) {
        <app-dialogo-confirmacion
          [titulo]="areaParaCambiarEstado()!.activo ? '¿Desactivar área hospitalaria?' : '¿Reactivar área?'"
          [mensaje]="
            areaParaCambiarEstado()!.activo
              ? 'Al desactivar el área ' + areaParaCambiarEstado()!.nombre + ', no se podrán registrar nuevos tickets ni equipos en ella.'
              : '¿Desea volver a activar el área ' + areaParaCambiarEstado()!.nombre + '?'
          "
          [textoConfirmar]="areaParaCambiarEstado()!.activo ? 'Desactivar área' : 'Reactivar área'"
          textoCancelar="Cancelar"
          (confirmar)="ejecutarCambioEstado()"
          (cancelar)="cancelarCambioEstado()"
        ></app-dialogo-confirmacion>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--espacio-6);

      @media (max-width: 640px) {
        padding: var(--espacio-4);
      }
    }

    .pagina-areas {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-6);
      max-width: 80rem;
      margin: 0 auto;

      &__cabecera {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--espacio-4);
        flex-wrap: wrap;
      }

      &__titulo {
        margin: 0;
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-main);
        letter-spacing: -0.02em;
      }

      &__subtitulo {
        margin: var(--espacio-xs) 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        max-width: 45rem;
      }
    }

    .btn-nuevo {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      height: var(--touch-min);
      padding: 0 var(--espacio-4);
      background-color: var(--color-primary-base);
      color: var(--prim-blanco);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background-color var(--trans-fast), transform var(--trans-fast);

      &:hover {
        background-color: var(--color-primary-hover);
        transform: translateY(-1px);
      }

      &--sm {
        height: 2.25rem;
        margin-top: var(--espacio-2);
      }
    }

    .icono-btn {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .filtro-inactivas {
      display: flex;
      align-items: center;
      padding-left: var(--espacio-2);
    }

    .check-label {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      cursor: pointer;
      user-select: none;
    }

    .fila-area {
      cursor: pointer;

      &:focus-visible {
        outline: 2px solid var(--color-primary-base);
        outline-offset: -2px;
      }

      &--inactiva {
        opacity: 0.65;
        background-color: var(--color-surface-sunken);
      }
    }

    .celda-nombre {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
    }

    .nombre-area {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);
    }

    .badge-inactiva {
      font-size: var(--font-size-2xs);
      padding: 0.1rem var(--espacio-xs);
      border-radius: var(--radius-xs);
      background-color: var(--color-surface-hover);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border-subtle);
    }

    .celda-anexo {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      font-family: monospace;
      font-size: var(--font-size-xs);
    }

    .icono-anexo {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .nombre-encargado {
      color: var(--color-text-main);
    }

    .badge-equipos {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-sunken);
      border: 1px solid var(--color-border-subtle);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-main);
    }

    .icono-equipo {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-sm);
      color: var(--color-primary-base);
    }

    .acciones-fila {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--espacio-xs);
    }

    .btn-accion {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: background-color var(--trans-fast), color var(--trans-fast);

      &:hover {
        background-color: var(--color-surface-hover);
        color: var(--color-text-main);
      }

      &--reactivar:hover {
        color: var(--color-secondary-base);
      }
    }

    .icono-accion {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .texto-apagado {
      color: var(--color-text-muted);
    }

    .text-right {
      text-align: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasListaPage implements OnInit {
  readonly store = inject(AreasStore);
  private readonly router = inject(Router);

  readonly columnas: readonly ColumnaTabla[] = [
    { campo: 'nombre', titulo: 'Área' },
    { campo: 'piso', titulo: 'Piso' },
    { campo: 'anexo', titulo: 'Anexo' },
    { campo: 'encargado', titulo: 'Encargado(a)' },
    { campo: 'equipos', titulo: 'Equipos (PC · Imp)' },
  ];

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

  alCerrarModal(recargar: boolean): void {
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
