import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonalStore } from '../../estado/personal.store';
import {
  ContrasenaTemporalInfo,
  PersonalItem,
} from '../../modelos/personal.model';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import {
  ColumnaTabla,
  TablaAdministracionComponent,
} from '../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { InsigniaGradoComponent } from '../../../../../compartido/ui/atomos/insignia-grado/insignia-grado.component';
import { DialogoPersonalComponent } from '../../componentes/dialogo-personal/dialogo-personal.component';
import { DialogoContrasenaTemporalComponent } from '../../componentes/dialogo-contrasena-temporal/dialogo-contrasena-temporal.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-personal-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TablaAdministracionComponent,
    InsigniaGradoComponent,
    DialogoPersonalComponent,
    DialogoContrasenaTemporalComponent,
    DialogoConfirmacionComponent,
  ],
  template: `
    <div class="pagina-personal">
      <header class="pagina-personal__cabecera">
        <div>
          <h1 class="pagina-personal__titulo">Personal y cuentas de acceso</h1>
          <p class="pagina-personal__subtitulo">
            Administre al personal de salud y asistencial del hospital, sus credenciales y áreas de adscripción.
          </p>
        </div>
        <button
          type="button"
          class="btn-nuevo"
          (click)="abrirModalNuevo()"
          aria-label="Registrar nuevo colaborador"
        >
          <span class="icono-btn" aria-hidden="true">person_add</span>
          <span>Registrar personal</span>
        </button>
      </header>

      <app-tabla-administracion
        [columnas]="columnas"
        tituloAccesible="Listado de personal y cuentas del hospital"
        [cargando]="store.cargando()"
        [vacio]="store.vacio()"
        mensajeVacio="No se encontraron colaboradores registrados con los filtros aplicados."
        placeholderBusqueda="Buscar por nombre, usuario o correo..."
        [busqueda]="busquedaTexto()"
        (busquedaChange)="alCambiarBusqueda($event)"
      >
        <div filtros class="filtros-personal">
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
            [ngModel]="filtroRol()"
            (ngModelChange)="alCambiarRol($event)"
            aria-label="Filtrar por perfil"
          >
            <option [ngValue]="null">Todos los perfiles</option>
            <option value="USUARIO_FINAL">Personal asistencial</option>
            <option value="ADMINISTRADOR">Administrador de Mesa</option>
          </select>
        </div>

        <button
          accion-vacio
          type="button"
          class="btn-nuevo btn-nuevo--sm"
          (click)="abrirModalNuevo()"
        >
          <span class="icono-btn" aria-hidden="true">person_add</span>
          <span>Registrar colaborador</span>
        </button>

        <ng-container filas>
          @for (p of store.personal(); track p.id) {
            <tr class="fila-personal" [class.fila-personal--inactiva]="!p.activo">
              <td>
                <div class="celda-colaborador">
                  <div class="fila-nombre">
                    <app-insignia-grado [grado]="p.grado"></app-insignia-grado>
                    <span class="nombre-visible">{{ p.nombreVisible }}</span>
                  </div>
                  <span class="nombre-completo">{{ p.nombreCompleto }}</span>
                </div>
              </td>
              <td>{{ p.nombreArea || 'Sin área asignada' }}</td>
              <td>
                @if (p.nombreUsuario) {
                  <code class="codigo-usuario">{{ p.nombreUsuario }}</code>
                } @else {
                  <span class="texto-apagado">—</span>
                }
              </td>
              <td>
                <span class="celda-correo">{{ p.correo }}</span>
              </td>
              <td>
                <span class="badge-rol" [class.badge-rol--admin]="p.rol === 'ADMINISTRADOR'">
                  {{ p.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Asistencial' }}
                </span>
              </td>
              <td>
                <span
                  class="badge-estado"
                  [class.badge-estado--activo]="p.activo"
                  [class.badge-estado--bloqueado]="!!p.bloqueadoHasta"
                >
                  {{
                    p.bloqueadoHasta
                      ? 'Bloqueada temporalmente'
                      : p.activo
                      ? 'En servicio'
                      : 'Inactivo'
                  }}
                </span>
              </td>
              <td class="text-right" (click)="$event.stopPropagation()">
                <div class="acciones-fila">
                  <button
                    type="button"
                    class="btn-accion"
                    [attr.aria-label]="'Editar colaborador ' + p.nombreVisible"
                    (click)="abrirModalEditar(p)"
                    title="Editar colaborador"
                  >
                    <span class="icono-accion" aria-hidden="true">edit</span>
                  </button>
                  <button
                    type="button"
                    class="btn-accion"
                    [attr.aria-label]="'Restablecer contraseña de ' + p.nombreVisible"
                    (click)="confirmarRestablecer(p)"
                    title="Restablecer contraseña"
                  >
                    <span class="icono-accion" aria-hidden="true">password</span>
                  </button>
                  <button
                    type="button"
                    class="btn-accion"
                    [class.btn-accion--reactivar]="!p.activo"
                    [attr.aria-label]="(p.activo ? 'Desactivar' : 'Reactivar') + ' cuenta de ' + p.nombreVisible"
                    (click)="confirmarToggleActivo(p)"
                    [title]="p.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'"
                  >
                    <span class="icono-accion" aria-hidden="true">
                      {{ p.activo ? 'person_off' : 'check_circle' }}
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          }
        </ng-container>
      </app-tabla-administracion>

      @if (modalPersonalAbierto()) {
        <app-dialogo-personal
          [personalParaEditar]="personalParaEditar()"
          (guardado)="alGuardarPersonal($event)"
          (cancelado)="modalPersonalAbierto.set(false)"
        ></app-dialogo-personal>
      }

      @if (claveTemporalGenerada()) {
        <app-dialogo-contrasena-temporal
          [contrasena]="claveTemporalGenerada()!"
          [nombreUsuario]="usuarioClaveTemporal()"
          (cerrado)="claveTemporalGenerada.set(null)"
        ></app-dialogo-contrasena-temporal>
      }

      @if (itemParaToggle()) {
        <app-dialogo-confirmacion
          [titulo]="itemParaToggle()!.activo ? '¿Desactivar cuenta de acceso?' : '¿Reactivar cuenta?'"
          [mensaje]="
            itemParaToggle()!.activo
              ? 'Al desactivar a ' + itemParaToggle()!.nombreVisible + ', no podrá ingresar a la Mesa de Ayuda ni reportar incidencias.'
              : '¿Desea volver a activar la cuenta de ' + itemParaToggle()!.nombreVisible + '?'
          "
          [textoConfirmar]="itemParaToggle()!.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'"
          [esPeligroso]="itemParaToggle()!.activo"
          (confirmar)="ejecutarToggleActivo()"
          (cancelar)="itemParaToggle.set(null)"
        ></app-dialogo-confirmacion>
      }

      @if (itemParaRestablecer()) {
        <app-dialogo-confirmacion
          titulo="¿Restablecer contraseña de acceso?"
          [mensaje]="
            'Se generará una nueva contraseña temporal para ' +
            itemParaRestablecer()!.nombreVisible +
            '. Se le exigirá cambiarla en su siguiente ingreso.'
          "
          textoConfirmar="Generar contraseña"
          (confirmar)="ejecutarRestablecerContrasena()"
          (cancelar)="itemParaRestablecer.set(null)"
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

    .pagina-personal {
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

    .filtros-personal {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      flex-wrap: wrap;
    }

    .select-filtro {
      height: var(--touch-min);
      padding: 0 var(--espacio-3);
      background-color: var(--color-surface-sunken);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      color: var(--color-text-main);

      &:focus-visible {
        outline: none;
        border-color: var(--color-primary-base);
      }
    }

    .fila-personal {
      &--inactiva {
        opacity: 0.65;
        background-color: var(--color-surface-sunken);
      }
    }

    .celda-colaborador {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .fila-nombre {
      display: flex;
      align-items: center;
      gap: var(--espacio-xs);
    }

    .nombre-visible {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-main);
    }

    .nombre-completo {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .codigo-usuario {
      font-family: monospace;
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      background-color: var(--color-surface-sunken);
      padding: 0.1rem var(--espacio-xs);
      border-radius: var(--radius-xs);
    }

    .celda-correo {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .badge-rol {
      display: inline-flex;
      font-size: var(--font-size-xs);
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-sunken);
      color: var(--color-text-main);
      border: 1px solid var(--color-border-subtle);

      &--admin {
        background-color: var(--color-primary-sunken);
        color: var(--color-primary-base);
        border-color: var(--color-primary-sunken);
        font-weight: var(--font-weight-medium);
      }
    }

    .badge-estado {
      display: inline-flex;
      font-size: var(--font-size-xs);
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-sunken);
      color: var(--color-text-muted);

      &--activo {
        background-color: var(--color-secondary-sunken);
        color: var(--color-secondary-base);
        font-weight: var(--font-weight-medium);
      }

      &--bloqueado {
        background-color: var(--color-error-bg);
        color: var(--color-error-text);
        font-weight: var(--font-weight-medium);
      }
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
export class PersonalListaPage implements OnInit {
  readonly store = inject(PersonalStore);
  private readonly areasApi = inject(AreasApi);

  readonly columnas: readonly ColumnaTabla[] = [
    { campo: 'colaborador', titulo: 'Colaborador(a)' },
    { campo: 'area', titulo: 'Área' },
    { campo: 'usuario', titulo: 'Usuario' },
    { campo: 'correo', titulo: 'Correo institucional' },
    { campo: 'rol', titulo: 'Perfil' },
    { campo: 'estado', titulo: 'Estado' },
  ];

  readonly areas = signal<AreaResumen[]>([]);
  readonly busquedaTexto = signal<string>('');
  readonly filtroArea = signal<number | null>(null);
  readonly filtroRol = signal<string | null>(null);

  readonly modalPersonalAbierto = signal<boolean>(false);
  readonly personalParaEditar = signal<PersonalItem | null>(null);

  readonly claveTemporalGenerada = signal<string | null>(null);
  readonly usuarioClaveTemporal = signal<string | null>(null);

  readonly itemParaToggle = signal<PersonalItem | null>(null);
  readonly itemParaRestablecer = signal<PersonalItem | null>(null);

  ngOnInit(): void {
    this.store.cargar();
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (lista) => this.areas.set(lista),
    });
  }

  alCambiarBusqueda(texto: string): void {
    this.busquedaTexto.set(texto);
    this.store.cargar({ busqueda: texto, pagina: 0 });
  }

  alCambiarArea(idArea: number | null): void {
    this.filtroArea.set(idArea);
    this.store.cargar({ idArea, pagina: 0 });
  }

  alCambiarRol(rol: string | null): void {
    this.filtroRol.set(rol);
    this.store.cargar({ rol, pagina: 0 });
  }

  abrirModalNuevo(): void {
    this.personalParaEditar.set(null);
    this.modalPersonalAbierto.set(true);
  }

  abrirModalEditar(item: PersonalItem): void {
    this.personalParaEditar.set(item);
    this.modalPersonalAbierto.set(true);
  }

  alGuardarPersonal(resultado: {
    personal: PersonalItem;
    contrasenaTemporal?: string;
  }): void {
    this.modalPersonalAbierto.set(false);
    if (resultado.contrasenaTemporal) {
      this.usuarioClaveTemporal.set(resultado.personal.nombreUsuario);
      this.claveTemporalGenerada.set(resultado.contrasenaTemporal);
    }
  }

  confirmarToggleActivo(item: PersonalItem): void {
    this.itemParaToggle.set(item);
  }

  ejecutarToggleActivo(): void {
    const item = this.itemParaToggle();
    if (!item) return;

    this.store.toggleActivo(item.id).subscribe({
      next: () => this.itemParaToggle.set(null),
      error: () => this.itemParaToggle.set(null),
    });
  }

  confirmarRestablecer(item: PersonalItem): void {
    this.itemParaRestablecer.set(item);
  }

  ejecutarRestablecerContrasena(): void {
    const item = this.itemParaRestablecer();
    if (!item) return;

    this.store.restablecerContrasena(item.id).subscribe({
      next: (res) => {
        this.itemParaRestablecer.set(null);
        this.usuarioClaveTemporal.set(item.nombreUsuario);
        this.claveTemporalGenerada.set(res.contrasenaTemporal);
      },
      error: () => this.itemParaRestablecer.set(null),
    });
  }
}
