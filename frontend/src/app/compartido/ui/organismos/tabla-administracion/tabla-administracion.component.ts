import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnaTabla {
  readonly campo: string;
  readonly titulo: string;
  readonly ancho?: string;
  readonly alineacion?: 'izquierda' | 'centro' | 'derecha';
}

@Component({
  selector: 'app-tabla-administracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tabla-admin">
      <div class="tabla-admin__barra-herramientas">
        <div class="tabla-admin__busqueda-filtros">
          @if (mostrarBuscador()) {
            <div class="tabla-admin__buscador">
              <span class="tabla-admin__icono-lupa" aria-hidden="true">search</span>
              <input
                type="text"
                class="tabla-admin__input-busqueda"
                [placeholder]="placeholderBusqueda()"
                [ngModel]="busqueda()"
                (ngModelChange)="onBusquedaChange($event)"
                [attr.aria-label]="placeholderBusqueda()"
              />
              @if (busqueda()) {
                <button
                  type="button"
                  class="tabla-admin__btn-limpiar"
                  aria-label="Limpiar búsqueda"
                  (click)="onBusquedaChange('')"
                >
                  <span class="icono-limpiar" aria-hidden="true">close</span>
                </button>
              }
            </div>
          }
          <div class="tabla-admin__filtros-extra">
            <ng-content select="[filtros]"></ng-content>
          </div>
        </div>

        <div class="tabla-admin__acciones-cabecera">
          <ng-content select="[acciones-cabecera]"></ng-content>
        </div>
      </div>

      <div class="tabla-admin__contenedor-tabla">
        <table class="tabla-admin__tabla">
          @if (tituloAccesible()) {
            <caption class="sr-only">{{ tituloAccesible() }}</caption>
          }

          <thead>
            <tr>
              @for (col of columnas(); track col.campo) {
                <th
                  scope="col"
                  [style.width]="col.ancho || null"
                  [class.text-center]="col.alineacion === 'centro'"
                  [class.text-right]="col.alineacion === 'derecha'"
                >
                  {{ col.titulo }}
                </th>
              }
              @if (tieneAcciones()) {
                <th scope="col" class="text-right tabla-admin__th-acciones">Acciones</th>
              }
            </tr>
          </thead>

          <tbody>
            @if (cargando()) {
              @for (n of [1, 2, 3, 4]; track n) {
                <tr class="tabla-admin__fila-esqueleto">
                  <td [attr.colspan]="columnas().length + (tieneAcciones() ? 1 : 0)">
                    <div class="esqueleto-linea"></div>
                  </td>
                </tr>
              }
            } @else if (vacio()) {
              <tr>
                <td
                  [attr.colspan]="columnas().length + (tieneAcciones() ? 1 : 0)"
                  class="tabla-admin__celda-vacia"
                >
                  <div class="tabla-admin__estado-vacio">
                    <span class="icono-vacio" aria-hidden="true">inbox</span>
                    <p class="tabla-admin__mensaje-vacio">{{ mensajeVacio() }}</p>
                    <ng-content select="[accion-vacio]"></ng-content>
                  </div>
                </td>
              </tr>
            } @else {
              <ng-content select="[filas]"></ng-content>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .tabla-admin {
      background-color: var(--comp-tabla-bg);
      border: var(--comp-tabla-borde);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);

      &__barra-herramientas {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--espacio-4);
        padding: var(--espacio-3) var(--espacio-4);
        background-color: var(--color-surface-card);
        border-bottom: 1px solid var(--color-border-subtle);
        flex-wrap: wrap;
      }

      &__busqueda-filtros {
        display: flex;
        align-items: center;
        gap: var(--espacio-3);
        flex: 1 1 20rem;
        flex-wrap: wrap;
      }

      &__buscador {
        position: relative;
        display: flex;
        align-items: center;
        flex: 1 1 14rem;
        max-width: 24rem;
      }

      &__icono-lupa {
        position: absolute;
        left: var(--espacio-3);
        color: var(--color-text-muted);
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: var(--font-size-md);
        pointer-events: none;
      }

      &__input-busqueda {
        width: 100%;
        height: var(--touch-min);
        padding: var(--espacio-2) var(--espacio-7) var(--espacio-2) var(--espacio-7);
        background-color: var(--color-surface-sunken);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        color: var(--color-text-main);
        transition: border-color var(--trans-fast);

        &:focus-visible {
          outline: none;
          border-color: var(--color-primary-base);
          background-color: var(--color-surface-card);
        }
      }

      &__btn-limpiar {
        position: absolute;
        right: var(--espacio-2);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.5rem;
        height: 1.5rem;
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;

        &:hover {
          color: var(--color-text-main);
        }
      }

      &__filtros-extra {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
      }

      &__acciones-cabecera {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
      }

      &__contenedor-tabla {
        width: 100%;
        overflow-x: auto;
      }

      &__tabla {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: var(--font-size-sm);

        thead {
          background-color: var(--comp-tabla-cabecera-bg);
          border-bottom: 1px solid var(--color-border-subtle);

          th {
            padding: var(--espacio-3) var(--espacio-4);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-bold);
            color: var(--color-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        }

        tbody {
          ::ng-deep tr {
            border-bottom: 1px solid var(--color-border-subtle);
            transition: background-color var(--trans-fast);

            &:hover {
              background-color: var(--comp-tabla-fila-hover-bg);
            }

            &:last-child {
              border-bottom: none;
            }
          }

          ::ng-deep td {
            padding: var(--espacio-3) var(--espacio-4);
            color: var(--color-text-main);
            vertical-align: middle;
          }
        }
      }

      &__th-acciones {
        text-align: right;
      }

      &__celda-vacia {
        padding: var(--espacio-8) !important;
        text-align: center;
      }

      &__estado-vacio {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--espacio-2);
        color: var(--color-text-muted);
      }

      &__mensaje-vacio {
        margin: 0;
        font-size: var(--font-size-sm);
      }

      .icono-vacio {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: 2.5rem;
      }

      .icono-limpiar {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: var(--font-size-sm);
      }

      .esqueleto-linea {
        height: 1.5rem;
        background: linear-gradient(90deg, var(--color-surface-sunken) 25%, var(--color-surface-hover) 50%, var(--color-surface-sunken) 75%);
        background-size: 200% 100%;
        animation: pulsoEsqueleto 1.5s infinite;
        border-radius: var(--radius-sm);
      }

      @keyframes pulsoEsqueleto {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .text-center { text-align: center; }
      .text-right { text-align: right; }
    }
  `],
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

  readonly busqueda = input<string>('');
  readonly busquedaChange = output<string>();

  onBusquedaChange(valor: string): void {
    this.busquedaChange.emit(valor);
  }
}
