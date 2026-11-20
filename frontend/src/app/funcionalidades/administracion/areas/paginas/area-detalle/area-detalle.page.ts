import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AreasStore } from '../../estado/areas.store';
import { TarjetaEquipoComponent } from '../../../../../compartido/ui/moleculas/tarjeta-equipo/tarjeta-equipo.component';
import { InsigniaGradoComponent } from '../../../../../compartido/ui/atomos/insignia-grado/insignia-grado.component';
import { DialogoAreaComponent } from '../../componentes/dialogo-area/dialogo-area.component';

type PestanaDetalle = 'personal' | 'computadoras' | 'impresoras';

@Component({
  selector: 'app-area-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TarjetaEquipoComponent,
    DialogoAreaComponent,
  ],
  template: `
    @if (store.cargandoDetalle()) {
      <div class="cargando-contenedor">
        <div class="spinner-grande" aria-hidden="true"></div>
        <p>Cargando información del área hospitalaria...</p>
      </div>
    } @else if (store.areaSeleccionada(); as area) {
      <div class="pagina-detalle">
        <nav class="migas-pan" aria-label="Navegación de retorno">
          <a routerLink="/administracion/areas" class="link-volver">
            <span class="icono-volver" aria-hidden="true">arrow_back</span>
            <span>Volver a Áreas del hospital</span>
          </a>
        </nav>

        <header class="detalle-cabecera">
          <div class="detalle-cabecera__info">
            <div class="detalle-cabecera__titulo-fila">
              <h1 class="detalle-titulo">{{ area.nombre }}</h1>
              @if (!area.activo) {
                <span class="badge-inactiva">Área Inactiva</span>
              }
            </div>

            <div class="detalle-metadatos">
              <span class="metadato-item">
                <span class="icono-meta" aria-hidden="true">apartment</span>
                <span>{{ area.ubicacionLegible }}</span>
              </span>

              @if (area.anexo) {
                <span class="metadato-item">
                  <span class="icono-meta" aria-hidden="true">call</span>
                  <span>Anexo {{ area.anexo }}</span>
                </span>
              }

              @if (area.encargado) {
                <span class="metadato-item">
                  <span class="icono-meta" aria-hidden="true">person</span>
                  <span>Encargado(a): <strong>{{ area.encargado.nombreVisible }}</strong></span>
                </span>
              }
            </div>

            @if (area.referenciaUbicacion) {
              <p class="detalle-referencia">
                <span class="icono-meta" aria-hidden="true">place</span>
                <span>{{ area.referenciaUbicacion }}</span>
              </p>
            }
          </div>

          <div class="detalle-cabecera__acciones">
            <button
              type="button"
              class="btn-editar"
              (click)="abrirModalEditar()"
              aria-label="Editar datos del área"
            >
              <span class="icono-btn" aria-hidden="true">edit</span>
              <span>Editar área</span>
            </button>
          </div>
        </header>

        <!-- Pestañas de detalle -->
        <div class="contenedor-pestanas">
          <div class="barra-pestanas" role="tablist" aria-label="Secciones del área">
            <button
              type="button"
              role="tab"
              class="btn-pestana"
              [class.btn-pestana--activa]="pestanaActiva() === 'personal'"
              [attr.aria-selected]="pestanaActiva() === 'personal'"
              aria-controls="panel-personal"
              id="tab-personal"
              (click)="seleccionarPestana('personal')"
            >
              <span class="icono-tab" aria-hidden="true">group</span>
              <span>Personal adscrito ({{ store.personal().length }})</span>
            </button>

            <button
              type="button"
              role="tab"
              class="btn-pestana"
              [class.btn-pestana--activa]="pestanaActiva() === 'computadoras'"
              [attr.aria-selected]="pestanaActiva() === 'computadoras'"
              aria-controls="panel-computadoras"
              id="tab-computadoras"
              (click)="seleccionarPestana('computadoras')"
            >
              <span class="icono-tab" aria-hidden="true">computer</span>
              <span>Computadoras ({{ store.computadoras().length }})</span>
            </button>

            <button
              type="button"
              role="tab"
              class="btn-pestana"
              [class.btn-pestana--activa]="pestanaActiva() === 'impresoras'"
              [attr.aria-selected]="pestanaActiva() === 'impresoras'"
              aria-controls="panel-impresoras"
              id="tab-impresoras"
              (click)="seleccionarPestana('impresoras')"
            >
              <span class="icono-tab" aria-hidden="true">print</span>
              <span>Impresoras de red ({{ store.impresoras().length }})</span>
            </button>
          </div>

          <!-- Panel 1: Personal -->
          @if (pestanaActiva() === 'personal') {
            <section
              id="panel-personal"
              role="tabpanel"
              aria-labelledby="tab-personal"
              class="panel-contenido"
            >
              @if (store.personal().length === 0) {
                <div class="estado-vacio-panel">
                  <span class="icono-vacio" aria-hidden="true">person_off</span>
                  <p>No hay colaboradores adscritos a esta área actualmente.</p>
                </div>
              } @else {
                <div class="tabla-contenedor">
                  <table class="tabla-datos">
                    <caption class="sr-only">Personal adscrito al área {{ area.nombre }}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Colaborador(a)</th>
                        <th scope="col">Usuario institucional</th>
                        <th scope="col">Correo</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of store.personal(); track p.id) {
                        <tr>
                          <td>
                            <div class="celda-persona">
                              <strong>{{ p.nombreVisible }}</strong>
                              <span class="nombre-completo-sub">{{ p.nombreCompleto }}</span>
                            </div>
                          </td>
                          <td>
                            <code>{{ p.nombreUsuario || '—' }}</code>
                          </td>
                          <td>{{ p.correo }}</td>
                          <td>
                            <span
                              class="badge-estado"
                              [class.badge-estado--activo]="p.activo"
                            >
                              {{ p.activo ? 'En servicio' : 'Inactivo' }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }

          <!-- Panel 2: Computadoras -->
          @if (pestanaActiva() === 'computadoras') {
            <section
              id="panel-computadoras"
              role="tabpanel"
              aria-labelledby="tab-computadoras"
              class="panel-contenido"
            >
              @if (store.computadoras().length === 0) {
                <div class="estado-vacio-panel">
                  <span class="icono-vacio" aria-hidden="true">desktop_access_disabled</span>
                  <p>No hay computadoras registradas en esta área.</p>
                </div>
              } @else {
                <div class="grid-equipos">
                  @for (pc of store.computadoras(); track pc.id) {
                    <app-tarjeta-equipo [datos]="pc"></app-tarjeta-equipo>
                  }
                </div>
              }
            </section>
          }

          <!-- Panel 3: Impresoras -->
          @if (pestanaActiva() === 'impresoras') {
            <section
              id="panel-impresoras"
              role="tabpanel"
              aria-labelledby="tab-impresoras"
              class="panel-contenido"
            >
              @if (store.impresoras().length === 0) {
                <div class="estado-vacio-panel">
                  <span class="icono-vacio" aria-hidden="true">print_disabled</span>
                  <p>No hay impresoras en red registradas en esta área.</p>
                </div>
              } @else {
                <div class="grid-equipos">
                  @for (imp of store.impresoras(); track imp.id) {
                    <app-tarjeta-equipo [datos]="imp"></app-tarjeta-equipo>
                  }
                </div>
              }
            </section>
          }
        </div>

        @if (modalEditarAbierto()) {
          <app-dialogo-area
            [areaParaEditar]="area"
            (cerrado)="modalEditarAbierto.set(false)"
          ></app-dialogo-area>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--espacio-6);

      @media (max-width: 640px) {
        padding: var(--espacio-4);
      }
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

    .cargando-contenedor {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--espacio-4);
      padding: var(--espacio-12);
      color: var(--color-text-muted);
    }

    .spinner-grande {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid var(--color-border-subtle);
      border-top-color: var(--color-primary-base);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .pagina-detalle {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-6);
      max-width: 80rem;
      margin: 0 auto;
    }

    .link-volver {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      font-size: var(--font-size-sm);
      color: var(--color-primary-base);
      text-decoration: none;
      font-weight: var(--font-weight-medium);

      &:hover {
        text-decoration: underline;
      }
    }

    .icono-volver {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .detalle-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--espacio-4);
      padding: var(--espacio-5);
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;

      &__info {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-2);
      }

      &__titulo-fila {
        display: flex;
        align-items: center;
        gap: var(--espacio-3);
      }
    }

    .detalle-titulo {
      margin: 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-main);
      letter-spacing: -0.02em;
    }

    .badge-inactiva {
      font-size: var(--font-size-xs);
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-hover);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border-subtle);
    }

    .detalle-metadatos {
      display: flex;
      align-items: center;
      gap: var(--espacio-4);
      flex-wrap: wrap;
    }

    .metadato-item {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);

      strong {
        color: var(--color-text-main);
      }
    }

    .detalle-referencia {
      margin: var(--espacio-xs) 0 0;
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      font-size: var(--font-size-sm);
      color: var(--color-text-main);
      background-color: var(--color-surface-sunken);
      padding: var(--espacio-xs) var(--espacio-2);
      border-radius: var(--radius-sm);
      width: fit-content;
    }

    .icono-meta {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
      color: var(--color-text-muted);
    }

    .btn-editar {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      height: var(--touch-min);
      padding: 0 var(--espacio-4);
      background-color: var(--color-surface-card);
      color: var(--color-text-main);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background-color var(--trans-fast);

      &:hover {
        background-color: var(--color-surface-hover);
      }
    }

    .icono-btn {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .contenedor-pestanas {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-4);
    }

    .barra-pestanas {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      border-bottom: 2px solid var(--color-border-subtle);
      overflow-x: auto;
    }

    .btn-pestana {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-3) var(--espacio-4);
      border: none;
      background: transparent;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: color var(--trans-fast), border-color var(--trans-fast);
      white-space: nowrap;

      &:hover {
        color: var(--color-text-main);
      }

      &--activa {
        color: var(--color-primary-base);
        border-bottom-color: var(--color-primary-base);
        font-weight: var(--font-weight-semibold);
      }
    }

    .icono-tab {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .panel-contenido {
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--espacio-5);
      box-shadow: var(--shadow-sm);
    }

    .estado-vacio-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--espacio-2);
      padding: var(--espacio-8);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .icono-vacio {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: 2.5rem;
    }

    .tabla-contenedor {
      overflow-x: auto;
    }

    .tabla-datos {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);

      thead th {
        padding: var(--espacio-3) var(--espacio-4);
        background-color: var(--comp-tabla-cabecera-bg);
        border-bottom: 1px solid var(--color-border-subtle);
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      tbody td {
        padding: var(--espacio-3) var(--espacio-4);
        border-bottom: 1px solid var(--color-border-subtle);
        color: var(--color-text-main);
        vertical-align: middle;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }
    }

    .celda-persona {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .nombre-completo-sub {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .badge-estado {
      display: inline-flex;
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      background-color: var(--color-surface-sunken);
      color: var(--color-text-muted);

      &--activo {
        background-color: var(--color-secondary-sunken);
        color: var(--color-secondary-base);
        font-weight: var(--font-weight-medium);
      }
    }

    .grid-equipos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      gap: var(--espacio-4);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaDetallePage implements OnInit {
  readonly store = inject(AreasStore);
  private readonly route = inject(ActivatedRoute);

  readonly pestanaActiva = signal<PestanaDetalle>('personal');
  readonly modalEditarAbierto = signal<boolean>(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.obtenerDetalle(id);
    }
  }

  seleccionarPestana(pestana: PestanaDetalle): void {
    this.pestanaActiva.set(pestana);
  }

  abrirModalEditar(): void {
    this.modalEditarAbierto.set(true);
  }
}
