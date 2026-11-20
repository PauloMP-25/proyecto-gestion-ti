import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AreasStore } from '../../estado/areas.store';
import { TarjetaEquipoComponent } from '../../../../../compartido/ui/moleculas/tarjeta-equipo/tarjeta-equipo.component';
import { DialogoAreaComponent } from '../../componentes/dialogo-area/dialogo-area.component';
import { DialogoPersonalComponent } from '../../../personal/componentes/dialogo-personal/dialogo-personal.component';
import { DialogoEquipoComponent } from '../../../equipos/componentes/dialogo-equipo/dialogo-equipo.component';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { PersonalApi } from '../../../personal/servicios/personal.api';
import { PersonalItem } from '../../../personal/modelos/personal.model';

type PestanaDetalle = 'personal' | 'computadoras' | 'impresoras';

@Component({
  selector: 'app-area-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TarjetaEquipoComponent,
    DialogoAreaComponent,
    DialogoPersonalComponent,
    DialogoEquipoComponent,
    DialogoFormularioComponent,
    CampoFormularioComponent,
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
              <div class="panel-cabecera-acciones">
                <button
                  type="button"
                  class="btn-accion-tab"
                  (click)="abrirModalRegistrarPersonal()"
                >
                  <span class="icono-btn" aria-hidden="true">person_add</span>
                  <span>Registrar persona</span>
                </button>
                <button
                  type="button"
                  class="btn-accion-tab btn-accion-tab--secundario"
                  (click)="abrirModalReasignarPersonal(area.id)"
                >
                  <span class="icono-btn" aria-hidden="true">swap_horiz</span>
                  <span>Traer persona de otra área</span>
                </button>
              </div>

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
              <div class="panel-cabecera-acciones">
                <button
                  type="button"
                  class="btn-accion-tab"
                  (click)="abrirModalRegistrarEquipo('COMPUTADORA')"
                >
                  <span class="icono-btn" aria-hidden="true">add_to_queue</span>
                  <span>Registrar computadora</span>
                </button>
              </div>

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
              <div class="panel-cabecera-acciones">
                <button
                  type="button"
                  class="btn-accion-tab"
                  (click)="abrirModalRegistrarEquipo('IMPRESORA')"
                >
                  <span class="icono-btn" aria-hidden="true">print</span>
                  <span>Registrar impresora</span>
                </button>
              </div>

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

        @if (modalPersonalAbierto()) {
          <app-dialogo-personal
            [idAreaPreseleccionada]="area.id"
            (cancelado)="modalPersonalAbierto.set(false)"
            (guardado)="alGuardarPersonal(area.id)"
          ></app-dialogo-personal>
        }

        @if (modalEquipoAbierto()) {
          <app-dialogo-equipo
            [idAreaPreseleccionada]="area.id"
            [tipoPreseleccionado]="tipoEquipoParaCrear()"
            (cancelar)="modalEquipoAbierto.set(false)"
            (guardado)="alGuardarEquipo(area.id)"
          ></app-dialogo-equipo>
        }

        @if (modalReasignarAbierto()) {
          <app-dialogo-formulario
            titulo="Traer colaborador(a) a esta área"
            subtitulo="Seleccione a un personal activo para reasignarlo al servicio actual."
            (cancelar)="cerrarModalReasignar()"
          >
            <div cuerpo class="contenedor-reasignar">
              <app-campo-formulario
                etiqueta="Colaborador(a) a reasignar"
                paraId="selectorPersonalReasignar"
                ayuda="Solo se muestran colaboradores activos de otras áreas."
              >
                <select
                  id="selectorPersonalReasignar"
                  [ngModel]="idColaboradorParaReasignar()"
                  (ngModelChange)="idColaboradorParaReasignar.set($event)"
                  class="select-reasignar"
                >
                  <option [ngValue]="null" disabled>Seleccione un colaborador...</option>
                  @for (p of personalParaReasignar(); track p.id) {
                    <option [ngValue]="p.id">{{ p.nombreVisible }} ({{ p.nombreArea }})</option>
                  }
                </select>
              </app-campo-formulario>
            </div>

            <div pie class="acciones-dialogo">
              <button
                type="button"
                class="btn-cancelar-modal"
                (click)="cerrarModalReasignar()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-confirmar-modal"
                [disabled]="!idColaboradorParaReasignar() || reasignando()"
                (click)="confirmarReasignacion(area.id)"
              >
                {{ reasignando() ? 'Reasignando...' : 'Reasignar a esta área' }}
              </button>
            </div>
          </app-dialogo-formulario>
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
      padding: var(--espacio-12);
      color: var(--color-text-muted);
      gap: var(--espacio-4);
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
      max-width: 75rem;
      margin: 0 auto;
    }

    .link-volver {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      text-decoration: none;
      font-weight: var(--font-weight-medium);

      &:hover {
        color: var(--color-primary-base);
      }
    }

    .detalle-cabecera {
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--espacio-6);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--espacio-4);
      box-shadow: var(--shadow-sm);

      @media (max-width: 640px) {
        flex-direction: column;
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-3);
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
    }

    .badge-inactiva {
      display: inline-flex;
      padding: var(--espacio-2xs) var(--espacio-xs);
      background-color: var(--color-danger-subtle);
      color: var(--color-danger-text);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-sm);
    }

    .detalle-metadatos {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-4);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }

    .metadato-item {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-1);
    }

    .icono-meta {
      font-family: 'Material Symbols Outlined';
      font-size: 1.1rem;
    }

    .detalle-referencia {
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-1);
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      font-style: italic;
    }

    .btn-editar {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-2) var(--espacio-4);
      background-color: var(--color-surface-sunken);
      color: var(--color-text-main);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;

      &:hover {
        background-color: var(--color-surface-hover);
      }
    }

    .icono-btn {
      font-family: 'Material Symbols Outlined';
      font-size: 1.1rem;
    }

    .contenedor-pestanas {
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .barra-pestanas {
      display: flex;
      border-bottom: 1px solid var(--color-border-subtle);
      background-color: var(--color-surface-sunken);
      overflow-x: auto;
    }

    .btn-pestana {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-4) var(--espacio-6);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      white-space: nowrap;

      &:hover {
        color: var(--color-text-main);
        background-color: var(--color-surface-hover);
      }

      &--activa {
        color: var(--color-primary-base);
        border-bottom-color: var(--color-primary-base);
        background-color: var(--color-surface-card);
        font-weight: var(--font-weight-semibold);
      }
    }

    .icono-tab {
      font-family: 'Material Symbols Outlined';
      font-size: 1.2rem;
    }

    .panel-contenido {
      padding: var(--espacio-6);
    }

    .panel-cabecera-acciones {
      display: flex;
      flex-wrap: wrap;
      gap: var(--espacio-3);
      margin-bottom: var(--espacio-4);
    }

    .btn-accion-tab {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-2) var(--espacio-4);
      background-color: var(--color-brand-primary);
      color: var(--color-text-inverse);
      border: none;
      border-radius: var(--radius-sm);
      font-size: var(--tipo-cuerpo-sm-size);
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background-color: var(--color-brand-secondary);
      }

      &--secundario {
        background-color: transparent;
        color: var(--color-text-primary);
        border: 1px solid var(--color-border-subtle);

        &:hover {
          background-color: var(--color-surface-hover);
        }
      }
    }

    .estado-vacio-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--espacio-8);
      color: var(--color-text-muted);
      text-align: center;
      gap: var(--espacio-2);
    }

    .icono-vacio {
      font-family: 'Material Symbols Outlined';
      font-size: 2.5rem;
      opacity: 0.6;
    }

    .tabla-contenedor {
      overflow-x: auto;
    }

    .tabla-datos {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-sm);

      th {
        text-align: left;
        padding: var(--espacio-3) var(--espacio-4);
        background-color: var(--color-surface-sunken);
        color: var(--color-text-muted);
        font-weight: var(--font-weight-semibold);
        border-bottom: 1px solid var(--color-border-subtle);
      }

      td {
        padding: var(--espacio-3) var(--espacio-4);
        border-bottom: 1px solid var(--color-border-subtle);
        color: var(--color-text-main);
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

    .contenedor-reasignar {
      padding: var(--espacio-2) 0;
    }

    .select-reasignar {
      width: 100%;
      padding: var(--espacio-2) var(--espacio-3);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-input);
      color: var(--color-text-primary);
      font-size: var(--tipo-cuerpo-sm-size);
    }

    .acciones-dialogo {
      display: flex;
      justify-content: flex-end;
      gap: var(--espacio-3);
      width: 100%;
    }

    .btn-cancelar-modal {
      padding: var(--espacio-2) var(--espacio-4);
      border: 1px solid var(--color-border-subtle);
      background: transparent;
      color: var(--color-text-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: var(--tipo-cuerpo-sm-size);

      &:hover {
        background-color: var(--color-surface-hover);
      }
    }

    .btn-confirmar-modal {
      padding: var(--espacio-2) var(--espacio-4);
      background-color: var(--color-brand-primary);
      color: var(--color-text-inverse);
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 500;
      font-size: var(--tipo-cuerpo-sm-size);
      cursor: pointer;

      &:hover:not(:disabled) {
        background-color: var(--color-brand-secondary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
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
  private readonly personalApi = inject(PersonalApi);

  readonly pestanaActiva = signal<PestanaDetalle>('personal');
  readonly modalEditarAbierto = signal<boolean>(false);
  readonly modalPersonalAbierto = signal<boolean>(false);
  readonly modalEquipoAbierto = signal<boolean>(false);
  readonly tipoEquipoParaCrear = signal<string>('COMPUTADORA');

  readonly modalReasignarAbierto = signal<boolean>(false);
  readonly personalParaReasignar = signal<PersonalItem[]>([]);
  readonly idColaboradorParaReasignar = signal<number | null>(null);
  readonly reasignando = signal<boolean>(false);

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

  abrirModalRegistrarPersonal(): void {
    this.modalPersonalAbierto.set(true);
  }

  alGuardarPersonal(idArea: number): void {
    this.modalPersonalAbierto.set(false);
    this.store.obtenerDetalle(idArea);
  }

  abrirModalRegistrarEquipo(tipo: 'COMPUTADORA' | 'IMPRESORA'): void {
    this.tipoEquipoParaCrear.set(tipo);
    this.modalEquipoAbierto.set(true);
  }

  alGuardarEquipo(idArea: number): void {
    this.modalEquipoAbierto.set(false);
    this.store.obtenerDetalle(idArea);
  }

  abrirModalReasignarPersonal(idAreaActual: number): void {
    this.idColaboradorParaReasignar.set(null);
    this.reasignando.set(false);
    this.personalApi.listar({}).subscribe({
      next: (pag) => {
        // Filtrar solo colaboradores adscritos a otras áreas
        const otros = pag.contenido.filter(
          (p) => p.idArea !== idAreaActual && p.activo
        );
        this.personalParaReasignar.set(otros);
        this.modalReasignarAbierto.set(true);
      },
    });
  }

  cerrarModalReasignar(): void {
    this.modalReasignarAbierto.set(false);
    this.idColaboradorParaReasignar.set(null);
  }

  confirmarReasignacion(idArea: number): void {
    const idUsuario = this.idColaboradorParaReasignar();
    if (!idUsuario) return;

    this.reasignando.set(true);
    this.store.reasignarPersonal(idArea, idUsuario).subscribe({
      next: () => {
        this.reasignando.set(false);
        this.cerrarModalReasignar();
      },
      error: () => {
        this.reasignando.set(false);
      },
    });
  }
}
