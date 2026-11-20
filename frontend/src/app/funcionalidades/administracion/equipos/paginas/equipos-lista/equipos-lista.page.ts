import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquiposStore } from '../../estado/equipos.store';
import { EquipoItem } from '../../modelos/equipos.model';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import {
  ColumnaTabla,
  TablaAdministracionComponent,
} from '../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { EtiquetaIpComponent } from '../../../../../compartido/ui/atomos/etiqueta-ip/etiqueta-ip.component';
import { DialogoEquipoComponent } from '../../componentes/dialogo-equipo/dialogo-equipo.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-equipos-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TablaAdministracionComponent,
    EtiquetaIpComponent,
    DialogoEquipoComponent,
    DialogoConfirmacionComponent,
  ],
  template: `
    <div class="pagina-equipos">
      <header class="pagina-equipos__cabecera">
        <div>
          <h1 class="pagina-equipos__titulo">Equipos e impresoras</h1>
          <p class="pagina-equipos__subtitulo">
            Inventario hospitalario, direccionamiento IP estático y asignación por área.
          </p>
        </div>
        <button
          type="button"
          class="btn-nuevo"
          (click)="abrirModalNuevo()"
          aria-label="Registrar nuevo equipo"
        >
          <span class="icono-btn" aria-hidden="true">add_to_queue</span>
          <span>Registrar equipo</span>
        </button>
      </header>

      <app-tabla-administracion
        [columnas]="columnas"
        tituloAccesible="Listado de computadoras e impresoras del hospital"
        [cargando]="store.cargando()"
        [vacio]="store.vacio()"
        mensajeVacio="No se encontraron equipos registrados con los filtros aplicados."
        placeholderBusqueda="Buscar por código, IP, área o ubicación..."
        [busqueda]="busquedaTexto()"
        (busquedaChange)="alCambiarBusqueda($event)"
      >
        <div filtros class="filtros-equipos">
          <select
            class="select-filtro"
            [ngModel]="filtroArea()"
            (ngModelChange)="alCambiarArea($event)"
            aria-label="Filtrar por área hospitalaria"
          >
            <option [ngValue]="null">Todas las áreas</option>
            @for (a of areas(); track a.id) {
              <option [ngValue]="a.id">{{ a.nombre }}</option>
            }
          </select>

          <select
            class="select-filtro"
            [ngModel]="filtroTipo()"
            (ngModelChange)="alCambiarTipo($event)"
            aria-label="Filtrar por tipo de equipo"
          >
            <option [ngValue]="null">Todos los tipos</option>
            <option value="COMPUTADORA">Computadoras</option>
            <option value="IMPRESORA">Impresoras</option>
            <option value="OTRO">Otros</option>
          </select>

          <label class="filtro-checkbox">
            <input
              type="checkbox"
              [ngModel]="filtroSinIp()"
              (ngModelChange)="alCambiarSinIp($event)"
            />
            <span>Sin IP asignada</span>
          </label>
        </div>

        <button
          accion-vacio
          type="button"
          class="btn-nuevo btn-nuevo--sm"
          (click)="abrirModalNuevo()"
        >
          <span class="icono-btn" aria-hidden="true">add_to_queue</span>
          <span>Registrar equipo</span>
        </button>

        <ng-template #celdaPersonalizada let-columna="columna" let-item="item">
          @if (columna.campo === 'codigoInventario') {
            <div class="celda-codigo">
              <span class="codigo-texto">{{ item.codigoInventario }}</span>
              @if (item.marcaModelo) {
                <span class="modelo-texto">{{ item.marcaModelo }}</span>
              }
            </div>
          } @else if (columna.campo === 'tipo') {
            <span class="insignia-tipo" [class]="'insignia-tipo--' + item.tipo.toLowerCase()">
              {{ obtenerEtiquetaTipo(item.tipo) }}
            </span>
          } @else if (columna.campo === 'nombreArea') {
            <div class="celda-ubicacion">
              <span class="area-texto">{{ item.nombreArea }}</span>
              @if (item.referenciaUbicacion) {
                <span class="referencia-texto">{{ item.referenciaUbicacion }}</span>
              }
            </div>
          } @else if (columna.campo === 'ipVigente') {
            @if (item.ipVigente) {
              <app-etiqueta-ip [ip]="item.ipVigente"></app-etiqueta-ip>
            } @else {
              <span class="sin-ip" aria-label="Sin IP asignada">Sin IP</span>
            }
          } @else if (columna.campo === 'estado') {
            <span
              class="insignia-estado"
              [class.insignia-estado--activo]="item.activo && item.estado === 'EN_SERVICIO'"
              [class.insignia-estado--mantenimiento]="item.estado === 'EN_MANTENIMIENTO'"
              [class.insignia-estado--inactivo]="item.estado === 'DE_BAJA' || !item.activo"
            >
              {{ obtenerEtiquetaEstado(item.estado) }}
            </span>
          } @else if (columna.campo === 'acciones') {
            <div class="celda-acciones">
              <button
                type="button"
                class="btn-accion"
                (click)="abrirModalEditar(item)"
                [attr.aria-label]="'Editar equipo ' + item.codigoInventario"
                title="Editar equipo"
              >
                <span class="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>

              <button
                type="button"
                class="btn-accion"
                (click)="solicitarCambioEstado(item)"
                [attr.aria-label]="
                  item.estado === 'EN_SERVICIO'
                    ? 'Poner en mantenimiento a ' + item.codigoInventario
                    : 'Poner en servicio a ' + item.codigoInventario
                "
                [title]="
                  item.estado === 'EN_SERVICIO'
                    ? 'Poner en mantenimiento'
                    : 'Poner en servicio'
                "
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ item.estado === 'EN_SERVICIO' ? 'build' : 'check_circle' }}
                </span>
              </button>
            </div>
          }
        </ng-template>
      </app-tabla-administracion>

      @if (modalAbierto()) {
        <app-dialogo-equipo
          [equipoParaEditar]="equipoSeleccionado()"
          (cancelar)="cerrarModal()"
          (guardado)="alGuardarEquipo($event)"
        ></app-dialogo-equipo>
      }

      @if (confirmacionEstadoAbierta()) {
        <app-dialogo-confirmacion
          [titulo]="
            equipoParaConfirmar()?.estado === 'EN_SERVICIO'
              ? '¿Poner equipo en mantenimiento?'
              : '¿Poner equipo en servicio?'
          "
          [mensaje]="
            'Se cambiará el estado operativo de ' +
            equipoParaConfirmar()?.codigoInventario +
            '.'
          "
          [textoConfirmar]="
            equipoParaConfirmar()?.estado === 'EN_SERVICIO'
              ? 'Poner en mantenimiento'
              : 'Poner en servicio'
          "
          (confirmar)="confirmarCambioEstado()"
          (cancelar)="cerrarConfirmacionEstado()"
        ></app-dialogo-confirmacion>
      }
    </div>
  `,
  styles: [
    `
      .pagina-equipos {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-6);
        padding: var(--espacio-6);
        max-width: 80rem;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }

      .pagina-equipos__cabecera {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-4);

        @media (min-width: 640px) {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
        }
      }

      .pagina-equipos__titulo {
        font-size: var(--tipo-titulo-lg-size);
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 var(--espacio-1) 0;
      }

      .pagina-equipos__subtitulo {
        font-size: var(--tipo-cuerpo-md-size);
        color: var(--color-text-muted);
        margin: 0;
      }

      .btn-nuevo {
        display: inline-flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-2) var(--espacio-4);
        background-color: var(--color-brand-primary);
        color: var(--color-text-inverse);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--tipo-cuerpo-sm-size);
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
        white-space: nowrap;

        &:hover {
          background-color: var(--color-brand-secondary);
        }

        &--sm {
          font-size: var(--tipo-cuerpo-xs-size);
          padding: var(--espacio-1) var(--espacio-3);
        }
      }

      .icono-btn {
        font-family: 'Material Symbols Outlined';
        font-size: 1.25rem;
      }

      .filtros-equipos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--espacio-3);
        align-items: center;
      }

      .select-filtro {
        padding: var(--espacio-2) var(--espacio-3);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        background-color: var(--color-surface-card);
        color: var(--color-text-primary);
        font-size: var(--tipo-cuerpo-sm-size);

        &:focus {
          outline: none;
          border-color: var(--color-brand-primary);
        }
      }

      .filtro-checkbox {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
        font-size: var(--tipo-cuerpo-sm-size);
        color: var(--color-text-secondary);
        cursor: pointer;
        user-select: none;
      }

      .celda-codigo {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-0-5);
      }

      .codigo-texto {
        font-family: var(--fuente-mono, monospace);
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .modelo-texto {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
      }

      .insignia-tipo {
        display: inline-block;
        padding: var(--espacio-0-5) var(--espacio-2);
        border-radius: var(--radius-full);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 600;

        &--computadora {
          background-color: var(--color-brand-muted);
          color: var(--color-brand-primary);
        }

        &--impresora {
          background-color: var(--color-surface-hover);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-subtle);
        }

        &--otro {
          background-color: var(--color-surface-subtle);
          color: var(--color-text-muted);
        }
      }

      .celda-ubicacion {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-0-5);
      }

      .area-texto {
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .referencia-texto {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
      }

      .sin-ip {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
        font-style: italic;
      }

      .insignia-estado {
        display: inline-flex;
        align-items: center;
        padding: var(--espacio-0-5) var(--espacio-2);
        border-radius: var(--radius-full);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 600;

        &--activo {
          background-color: var(--color-success-subtle);
          color: var(--color-success-text);
        }

        &--mantenimiento {
          background-color: var(--color-warning-subtle);
          color: var(--color-warning-text);
        }

        &--inactivo {
          background-color: var(--color-danger-subtle);
          color: var(--color-danger-text);
        }
      }

      .celda-acciones {
        display: flex;
        gap: var(--espacio-1);
      }

      .btn-accion {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        padding: var(--espacio-1);
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background-color: var(--color-surface-hover);
          color: var(--color-text-primary);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposListaPage implements OnInit {
  readonly store = inject(EquiposStore);
  private readonly areasApi = inject(AreasApi);

  readonly areas = signal<AreaResumen[]>([]);
  readonly busquedaTexto = signal<string>('');
  readonly filtroArea = signal<number | null>(null);
  readonly filtroTipo = signal<string | null>(null);
  readonly filtroSinIp = signal<boolean>(false);

  readonly modalAbierto = signal<boolean>(false);
  readonly equipoSeleccionado = signal<EquipoItem | null>(null);

  readonly confirmacionEstadoAbierta = signal<boolean>(false);
  readonly equipoParaConfirmar = signal<EquipoItem | null>(null);

  readonly columnas: ColumnaTabla[] = [
    { campo: 'codigoInventario', titulo: 'Código / Modelo' },
    { campo: 'tipo', titulo: 'Tipo' },
    { campo: 'nombreArea', titulo: 'Área / Ubicación' },
    { campo: 'ipVigente', titulo: 'IP estática' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'acciones', titulo: 'Acciones' },
  ];

  ngOnInit(): void {
    this.store.cargar();
    this.cargarAreas();
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (areas) => this.areas.set(areas),
    });
  }

  alCambiarBusqueda(texto: string): void {
    this.busquedaTexto.set(texto);
    this.store.cargar({ buscar: texto, pagina: 0 });
  }

  alCambiarArea(idArea: number | null): void {
    this.filtroArea.set(idArea);
    this.store.cargar({ idArea, pagina: 0 });
  }

  alCambiarTipo(tipo: string | null): void {
    this.filtroTipo.set(tipo);
    this.store.cargar({ tipo, pagina: 0 });
  }

  alCambiarSinIp(sinIp: boolean): void {
    this.filtroSinIp.set(sinIp);
    this.store.cargar({ sinIp: sinIp || undefined, pagina: 0 });
  }

  abrirModalNuevo(): void {
    this.equipoSeleccionado.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(equipo: EquipoItem): void {
    this.equipoSeleccionado.set(equipo);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.equipoSeleccionado.set(null);
  }

  alGuardarEquipo(_guardado: EquipoItem): void {
    this.cerrarModal();
  }

  solicitarCambioEstado(equipo: EquipoItem): void {
    this.equipoParaConfirmar.set(equipo);
    this.confirmacionEstadoAbierta.set(true);
  }

  confirmarCambioEstado(): void {
    const eq = this.equipoParaConfirmar();
    if (!eq) return;

    const nuevoEstado =
      eq.estado === 'EN_SERVICIO' ? 'EN_MANTENIMIENTO' : 'EN_SERVICIO';

    this.store.cambiarEstado(eq.id, nuevoEstado).subscribe({
      next: () => this.cerrarConfirmacionEstado(),
      error: () => this.cerrarConfirmacionEstado(),
    });
  }

  cerrarConfirmacionEstado(): void {
    this.confirmacionEstadoAbierta.set(false);
    this.equipoParaConfirmar.set(null);
  }

  obtenerEtiquetaTipo(tipo: string): string {
    switch (tipo) {
      case 'COMPUTADORA':
        return 'Computadora';
      case 'IMPRESORA':
        return 'Impresora';
      default:
        return 'Equipo';
    }
  }

  obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
      case 'EN_SERVICIO':
        return 'En servicio';
      case 'EN_MANTENIMIENTO':
        return 'En mantenimiento';
      case 'DE_BAJA':
        return 'De baja';
      default:
        return estado;
    }
  }
}
