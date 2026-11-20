import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { EquiposStore } from '../../estado/equipos.store';
import { EquiposApi } from '../../servicios/equipos.api';
import {
  EquipoFormulario,
  EquipoItem,
} from '../../modelos/equipos.model';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';
import { validadorIpDisponible } from '../../../validacion/validadores-asincronos';

@Component({
  selector: 'app-dialogo-equipo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  template: `
    <app-dialogo-formulario
      [titulo]="equipoParaEditar() ? 'Editar equipo hospitalario' : 'Registrar nuevo equipo'"
      [subtitulo]="
        equipoParaEditar()
          ? 'Actualice la configuración de red, ubicación y especificaciones técnicas.'
          : 'Asigne un código de inventario, ubicación hospitalaria y dirección IP estática.'
      "
      (cancelar)="cerrar()"
    >
      <form [formGroup]="form" (ngSubmit)="guardar()" cuerpo>
        @if (errorGeneral()) {
          <div class="alerta-error" role="alert">
            <span class="icono-alerta" aria-hidden="true">warning</span>
            <span>{{ errorGeneral() }}</span>
          </div>
        }

        <!-- SECCIÓN 1: IDENTIFICACIÓN Y TIPO -->
        <fieldset class="seccion-fieldset">
          <legend class="seccion-legend">Identificación y Ubicación</legend>

          <div class="grid-dos-columnas">
            <app-campo-formulario
              etiqueta="Tipo de equipo"
              paraId="tipoEquipo"
              [requerido]="true"
              [error]="obtenerError('tipo')"
            >
              <select
                id="tipoEquipo"
                formControlName="tipo"
                (change)="onTipoOAreaChange()"
              >
                <option value="COMPUTADORA">Computadora / Estación de trabajo</option>
                <option value="IMPRESORA">Impresora de red</option>
                <option value="OTRO">Otro equipo hospitalario</option>
              </select>
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Área hospitalaria"
              paraId="areaEquipo"
              [requerido]="true"
              [error]="obtenerError('idArea')"
            >
              <select
                id="areaEquipo"
                formControlName="idArea"
                (change)="onTipoOAreaChange()"
              >
                <option [ngValue]="null" disabled>Seleccione un área...</option>
                @for (a of areas(); track a.id) {
                  <option [ngValue]="a.id">{{ a.nombre }}</option>
                }
              </select>
            </app-campo-formulario>
          </div>

          <div class="grid-dos-columnas">
            <app-campo-formulario
              etiqueta="Código de inventario"
              paraId="codigoInventario"
              [requerido]="true"
              ayuda="Código patrimonial o identificador hospitalario"
              [error]="obtenerError('codigoInventario')"
            >
              <input
                id="codigoInventario"
                type="text"
                formControlName="codigoInventario"
                placeholder="Ej. PC-ADM-01"
                (input)="onCodigoInput()"
              />
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Nombre descriptivo"
              paraId="nombreEquipo"
              [requerido]="true"
              ayuda="Ej. Computadora Admisión 2"
              [error]="obtenerError('nombre')"
            >
              <input
                id="nombreEquipo"
                type="text"
                formControlName="nombre"
                placeholder="Ej. Computadora Admisión Ventanilla 2"
              />
            </app-campo-formulario>
          </div>

          <app-campo-formulario
            etiqueta="Referencia de ubicación"
            paraId="referenciaUbicacion"
            ayuda="Ej. Ventanilla 2, Frente al módulo de triaje"
            [error]="obtenerError('referenciaUbicacion')"
          >
            <input
              id="referenciaUbicacion"
              type="text"
              formControlName="referenciaUbicacion"
              placeholder="Ej. Ventanilla 2"
            />
          </app-campo-formulario>
        </fieldset>

        <!-- SECCIÓN 2: CONFIGURACIÓN DE RED Y HARDWARE -->
        <fieldset class="seccion-fieldset">
          <legend class="seccion-legend">Red y Especificaciones Técnicas</legend>

          <div class="grid-dos-columnas">
            <app-campo-formulario
              etiqueta="Dirección IP estática"
              paraId="ipEstatica"
              ayuda="IPv4 estricta asignada en el hospital"
              [error]="obtenerErrorIp()"
            >
              <div class="contenedor-ip-input">
                <input
                  id="ipEstatica"
                  type="text"
                  formControlName="ipEstatica"
                  placeholder="Ej. 192.168.10.15"
                  class="input-ip"
                />
                @if (form.get('ipEstatica')?.pending) {
                  <span class="indicador-validacion validando" aria-live="polite">
                    Comprobando...
                  </span>
                } @else if (
                  form.get('ipEstatica')?.valid &&
                  form.get('ipEstatica')?.value &&
                  !form.get('ipEstatica')?.errors
                ) {
                  <span class="indicador-validacion disponible" aria-live="polite">
                    ✓ Disponible
                  </span>
                }
              </div>
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Nombre de red (hostname)"
              paraId="hostname"
              ayuda="Identificador DNS o NetBIOS"
              [error]="obtenerError('hostname')"
            >
              <input
                id="hostname"
                type="text"
                formControlName="hostname"
                placeholder="Ej. pc-adm-02"
              />
            </app-campo-formulario>
          </div>

          <div class="grid-dos-columnas">
            <app-campo-formulario
              etiqueta="Dirección física (MAC)"
              paraId="mac"
              ayuda="Formato: AA:BB:CC:DD:EE:FF"
              [error]="obtenerError('mac')"
            >
              <input
                id="mac"
                type="text"
                formControlName="mac"
                placeholder="00:1A:2B:3C:4D:5E"
              />
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Marca y modelo"
              paraId="marcaModelo"
              ayuda="Ej. HP ProDesk 400 G7"
              [error]="obtenerError('marcaModelo')"
            >
              <input
                id="marcaModelo"
                type="text"
                formControlName="marcaModelo"
                placeholder="Ej. HP ProDesk 400 G7"
              />
            </app-campo-formulario>
          </div>
        </fieldset>
      </form>

      <div pie class="acciones-dialogo">
        <button
          type="button"
          class="btn-cancelar"
          (click)="cerrar()"
          [disabled]="guardando()"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn-guardar"
          (click)="guardar()"
          [disabled]="form.invalid || guardando() || form.pending"
        >
          @if (guardando()) {
            <span class="spinner" aria-hidden="true"></span>
            <span>Guardando...</span>
          } @else {
            <span>{{ equipoParaEditar() ? 'Actualizar equipo' : 'Registrar equipo' }}</span>
          }
        </button>
      </div>
    </app-dialogo-formulario>
  `,
  styles: [
    `
      .alerta-error {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-3);
        background-color: var(--color-danger-subtle);
        border: 1px solid var(--color-danger-border);
        border-radius: var(--radius-md);
        color: var(--color-danger-text);
        margin-bottom: var(--espacio-4);
        font-size: var(--tipo-cuerpo-sm-size);
      }

      .icono-alerta {
        font-family: 'Material Symbols Outlined';
        font-size: 1.25rem;
      }

      .seccion-fieldset {
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        padding: var(--espacio-4);
        margin-bottom: var(--espacio-4);
      }

      .seccion-legend {
        font-size: var(--tipo-cuerpo-sm-size);
        font-weight: 600;
        color: var(--color-text-subtle);
        padding: 0 var(--espacio-2);
      }

      .grid-dos-columnas {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--espacio-3);

        @media (min-width: 640px) {
          grid-template-columns: 1fr 1fr;
        }
      }

      input[type='text'],
      select {
        width: 100%;
        padding: var(--espacio-2) var(--espacio-3);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        background-color: var(--color-surface-input);
        color: var(--color-text-primary);
        font-size: var(--tipo-cuerpo-sm-size);
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: var(--color-brand-primary);
          box-shadow: 0 0 0 2px var(--color-brand-muted);
        }
      }

      .contenedor-ip-input {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-ip {
        font-family: var(--fuente-mono, monospace);
        padding-right: 7.5rem;
      }

      .indicador-validacion {
        position: absolute;
        right: var(--espacio-2);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 600;
        pointer-events: none;

        &.validando {
          color: var(--color-text-muted);
        }

        &.disponible {
          color: var(--color-success-text);
        }
      }

      .acciones-dialogo {
        display: flex;
        justify-content: flex-end;
        gap: var(--espacio-3);
        width: 100%;
      }

      .btn-cancelar {
        padding: var(--espacio-2) var(--espacio-4);
        border: 1px solid var(--color-border-subtle);
        background: transparent;
        color: var(--color-text-primary);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--tipo-cuerpo-sm-size);

        &:hover:not(:disabled) {
          background-color: var(--color-surface-hover);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-guardar {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
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

      .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoEquipoComponent implements OnInit {
  equipoParaEditar = input<EquipoItem | null>(null);
  idAreaPreseleccionada = input<number | null>(null);
  tipoPreseleccionado = input<string | null>(null);

  cancelar = output<void>();
  guardado = output<EquipoItem>();

  private readonly fb = inject(FormBuilder);
  private readonly areasApi = inject(AreasApi);
  private readonly equiposApi = inject(EquiposApi);
  private readonly equiposStore = inject(EquiposStore);

  readonly areas = signal<AreaResumen[]>([]);
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly codigoEditadoManualmente = signal<boolean>(false);

  form!: FormGroup;

  ngOnInit(): void {
    const editando = this.equipoParaEditar();
    const areaInicial = editando?.idArea ?? this.idAreaPreseleccionada() ?? null;
    const tipoInicial = editando?.tipo ?? this.tipoPreseleccionado() ?? 'COMPUTADORA';

    if (editando) {
      this.codigoEditadoManualmente.set(true);
    }

    this.form = this.fb.group({
      tipo: [tipoInicial, [Validators.required]],
      idArea: [areaInicial, [Validators.required]],
      codigoInventario: [
        editando?.codigoInventario ?? '',
        [Validators.required, Validators.maxLength(20)],
      ],
      nombre: [
        editando ? `${editando.tipo} ${editando.codigoInventario}` : '',
        [Validators.required, Validators.maxLength(100)],
      ],
      referenciaUbicacion: [
        editando?.referenciaUbicacion ?? '',
        [Validators.maxLength(150)],
      ],
      ipEstatica: [
        editando?.ipVigente ?? '',
        {
          asyncValidators: [
            validadorIpDisponible(this.equiposApi, () => this.equipoParaEditar()?.id),
          ],
          updateOn: 'change',
        },
      ],
      hostname: [editando?.hostname ?? '', [Validators.maxLength(60)]],
      mac: [
        editando?.mac ?? '',
        [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)],
      ],
      marcaModelo: [editando?.marcaModelo ?? '', [Validators.maxLength(100)]],
    });

    this.cargarAreas();

    // Si es creación y no se ha editado el código manualmente, pedir sugerencia
    if (!editando && areaInicial) {
      this.solicitarSugerenciaCodigo(tipoInicial, areaInicial);
    }
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (areas) => {
        this.areas.set(areas);
      },
    });
  }

  onTipoOAreaChange(): void {
    if (this.codigoEditadoManualmente()) {
      return;
    }

    const tipo = this.form.get('tipo')?.value;
    const idArea = this.form.get('idArea')?.value;

    if (tipo && idArea) {
      this.solicitarSugerenciaCodigo(tipo, idArea);
    }
  }

  onCodigoInput(): void {
    const control = this.form.get('codigoInventario');
    if (control?.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
      this.codigoEditadoManualmente.set(true);
    }
  }

  private solicitarSugerenciaCodigo(tipo: string, idArea: number): void {
    this.equiposStore.sugerirCodigo(tipo, idArea).subscribe({
      next: (codigo) => {
        if (!this.codigoEditadoManualmente()) {
          this.form.get('codigoInventario')?.setValue(codigo);
          if (!this.form.get('nombre')?.value) {
            const nombreSugerido =
              tipo === 'COMPUTADORA'
                ? `Computadora ${codigo}`
                : tipo === 'IMPRESORA'
                ? `Impresora ${codigo}`
                : `Equipo ${codigo}`;
            this.form.get('nombre')?.setValue(nombreSugerido);
          }
        }
      },
    });
  }

  obtenerError(campo: string): string | null {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['required']) return 'Este campo es obligatorio.';
    if (c.errors['maxlength'])
      return `Supera el límite de ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['pattern']) return 'Formato inválido (ej: AA:BB:CC:DD:EE:FF).';
    if (c.errors['servidor']) return c.errors['servidor'];

    return 'Dato inválido.';
  }

  obtenerErrorIp(): string | null {
    const c = this.form.get('ipEstatica');
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['formatoInvalido']) return c.errors['formatoInvalido'];
    if (c.errors['ipEnUso']) return c.errors['ipEnUso'];
    if (c.errors['servidor']) return c.errors['servidor'];

    return 'Dirección IP no válida.';
  }

  guardar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();

    const formulario: EquipoFormulario = {
      tipo: v.tipo,
      idArea: Number(v.idArea),
      codigoInventario: v.codigoInventario.trim().toUpperCase(),
      marcaModelo: v.marcaModelo || null,
      referenciaUbicacion: v.referenciaUbicacion || null,
      ipEstatica: v.ipEstatica || null,
      hostname: v.hostname || null,
      mac: v.mac || null,
    };

    const editando = this.equipoParaEditar();
    const accion$ = editando
      ? this.equiposStore.actualizar(editando.id, formulario)
      : this.equiposStore.crear(formulario);

    accion$.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.guardado.emit(guardado);
      },
      error: (err) => {
        this.guardando.set(false);
        const msj = aplicarErroresServidor(this.form, err);
        if (msj) {
          this.errorGeneral.set(msj);
        }
      },
    });
  }

  cerrar(): void {
    this.cancelar.emit();
  }
}
