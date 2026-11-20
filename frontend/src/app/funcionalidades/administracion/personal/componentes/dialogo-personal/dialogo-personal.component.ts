import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CatalogosStore } from '../../../../../compartido/catalogos/catalogos.store';
import {
  GradoProfesional,
  nombreVisible,
} from '../../../../../compartido/catalogos/grado-profesional.enum';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { PersonalStore } from '../../estado/personal.store';
import {
  PersonalItem,
  PersonalRegistroForm,
  PersonalActualizarForm,
} from '../../modelos/personal.model';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';

@Component({
  selector: 'app-dialogo-personal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  template: `
    <app-dialogo-formulario
      [titulo]="personalParaEditar() ? 'Editar colaborador(a)' : 'Registrar nuevo personal'"
      [subtitulo]="
        personalParaEditar()
          ? 'Actualice el grado, área de adscripción y rol institucional.'
          : 'Complete los datos laborales y genere la cuenta de acceso a la Mesa de Ayuda.'
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

        <div class="aviso-privacidad" role="note">
          <span class="icono-privacidad" aria-hidden="true">verified_user</span>
          <p>
            <strong>Privacidad Institucional:</strong> No registre DNI, números telefónicos personales
            ni correos privados. Utilice únicamente datos estrictamente laborales.
          </p>
        </div>

        <!-- SECCIÓN 1: DATOS DEL PERSONAL -->
        <fieldset class="seccion-fieldset">
          <legend class="seccion-legend">Datos del personal</legend>

          <div class="grid-tres-columnas">
            <app-campo-formulario
              etiqueta="Grado profesional"
              paraId="gradoPersonal"
              [requerido]="true"
              [error]="obtenerError('grado')"
            >
              <select id="gradoPersonal" formControlName="grado">
                @for (g of catalogosStore.grados(); track g.codigo) {
                  <option [value]="g.codigo">{{ g.etiqueta }}</option>
                }
              </select>
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Nombres"
              paraId="nombresPersonal"
              [requerido]="true"
              [error]="obtenerError('nombres')"
            >
              <input
                id="nombresPersonal"
                type="text"
                formControlName="nombres"
                placeholder="Ej. Patricia Elena"
                (input)="onNombresApellidosChange()"
              />
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Apellidos"
              paraId="apellidosPersonal"
              [requerido]="true"
              [error]="obtenerError('apellidos')"
            >
              <input
                id="apellidosPersonal"
                type="text"
                formControlName="apellidos"
                placeholder="Ej. Ramos Quispe"
                (input)="onNombresApellidosChange()"
              />
            </app-campo-formulario>
          </div>

          <!-- Vista previa institucional reactiva -->
          <div class="vista-previa-nombre" aria-live="polite">
            <span class="vista-previa-label">Se mostrará en el hospital como:</span>
            <strong class="vista-previa-valor">{{ vistaPreviaNombre() || '—' }}</strong>
          </div>

          <app-campo-formulario
            etiqueta="Área hospitalaria adscrita"
            paraId="areaPersonal"
            [requerido]="true"
            ayuda="Servicio o pabellón principal de labores."
            [error]="obtenerError('idArea')"
          >
            <select id="areaPersonal" formControlName="idArea">
              <option [ngValue]="null" disabled>Seleccione un área...</option>
              @for (a of areas(); track a.id) {
                <option [ngValue]="a.id">{{ a.nombre }} ({{ a.ubicacionLegible }})</option>
              }
            </select>
          </app-campo-formulario>
        </fieldset>

        <!-- SECCIÓN 2: CUENTA DE ACCESO -->
        <fieldset class="seccion-fieldset">
          <legend class="seccion-legend">Cuenta de acceso institucional</legend>

          <div class="grid-dos-columnas">
            <app-campo-formulario
              etiqueta="Correo institucional"
              paraId="correoPersonal"
              [requerido]="true"
              ayuda="Dominio @hospital.gob.pe"
              [error]="obtenerError('correo')"
            >
              <input
                id="correoPersonal"
                type="email"
                formControlName="correo"
                placeholder="usuario@hospital.gob.pe"
              />
            </app-campo-formulario>

            <app-campo-formulario
              etiqueta="Usuario de acceso"
              paraId="usuarioPersonal"
              ayuda="Identificador único (letras, números y punto)."
              [error]="obtenerError('nombreUsuario')"
            >
              <input
                id="usuarioPersonal"
                type="text"
                formControlName="nombreUsuario"
                placeholder="Ej. pramos"
              />
            </app-campo-formulario>
          </div>

          <div class="campo-rol">
            <label class="label-rol">Perfil de acceso:</label>
            <div class="opciones-radio">
              <label class="radio-card" [class.radio-card--seleccionado]="form.get('rol')?.value === 'USUARIO_FINAL'">
                <input
                  type="radio"
                  formControlName="rol"
                  value="USUARIO_FINAL"
                />
                <div class="radio-card__contenido">
                  <span class="radio-card__titulo">Personal asistencial</span>
                  <span class="radio-card__desc">Reporta requerimientos y fallas desde su puesto de trabajo.</span>
                </div>
              </label>

              <label class="radio-card" [class.radio-card--seleccionado]="form.get('rol')?.value === 'ADMINISTRADOR'">
                <input
                  type="radio"
                  formControlName="rol"
                  value="ADMINISTRADOR"
                />
                <div class="radio-card__contenido">
                  <span class="radio-card__titulo">Administrador de la Mesa</span>
                  <span class="radio-card__desc">Gestión integral de áreas, colaboradores, inventario y soporte.</span>
                </div>
              </label>
            </div>
          </div>

          @if (!personalParaEditar()) {
            <div class="campo-clave-inicial">
              <label class="label-clave">Contraseña inicial:</label>
              <div class="opciones-clave">
                <label class="radio-inline">
                  <input
                    type="radio"
                    formControlName="generarContrasena"
                    [value]="true"
                  />
                  <span>Generar automáticamente (recomendado, temporal y segura)</span>
                </label>
                <label class="radio-inline">
                  <input
                    type="radio"
                    formControlName="generarContrasena"
                    [value]="false"
                  />
                  <span>Definir manualmente</span>
                </label>
              </div>

              @if (!form.get('generarContrasena')?.value) {
                <app-campo-formulario
                  etiqueta="Contraseña inicial"
                  paraId="claveManual"
                  ayuda="Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo."
                  [error]="obtenerError('contrasena')"
                >
                  <input
                    id="claveManual"
                    type="password"
                    formControlName="contrasena"
                    placeholder="Ingrese la contraseña inicial"
                  />
                </app-campo-formulario>
              }
            </div>
          }
        </fieldset>
      </form>

      <div class="dialogo-acciones" acciones>
        <button
          type="button"
          class="btn btn--secundario"
          (click)="cerrar()"
          [disabled]="guardando()"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn--primario"
          (click)="guardar()"
          [disabled]="guardando() || form.invalid"
        >
          @if (guardando()) {
            <span class="spinner" aria-hidden="true"></span>
            <span>Guardando...</span>
          } @else {
            <span>{{ personalParaEditar() ? 'Actualizar colaborador' : 'Registrar personal' }}</span>
          }
        </button>
      </div>
    </app-dialogo-formulario>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .seccion-fieldset {
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      padding: var(--espacio-4);
      margin-bottom: var(--espacio-5);
      background-color: var(--color-surface-card);
    }

    .seccion-legend {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-base);
      padding: 0 var(--espacio-2);
    }

    .grid-tres-columnas {
      display: grid;
      grid-template-columns: 8rem 1fr 1fr;
      gap: var(--espacio-3);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }

    .grid-dos-columnas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--espacio-3);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
    }

    .aviso-privacidad {
      display: flex;
      align-items: center;
      gap: var(--espacio-3);
      padding: var(--espacio-3);
      background-color: var(--color-surface-sunken);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      margin-bottom: var(--espacio-4);

      p {
        margin: 0;
      }
    }

    .icono-privacidad {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: 1.25rem;
      color: var(--color-primary-base);
      flex-shrink: 0;
    }

    .vista-previa-nombre {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-2) var(--espacio-3);
      background-color: var(--color-surface-sunken);
      border-radius: var(--radius-sm);
      margin-bottom: var(--espacio-4);
      font-size: var(--font-size-xs);
    }

    .vista-previa-label {
      color: var(--color-text-muted);
    }

    .vista-previa-valor {
      color: var(--color-primary-base);
      font-size: var(--font-size-sm);
    }

    .campo-rol,
    .campo-clave-inicial {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-2);
      margin-bottom: var(--espacio-4);
    }

    .label-rol,
    .label-clave {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-main);
    }

    .opciones-radio {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--espacio-3);

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .radio-card {
      display: flex;
      align-items: flex-start;
      gap: var(--espacio-2);
      padding: var(--espacio-3);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color var(--trans-fast), background-color var(--trans-fast);

      input {
        margin-top: 0.2rem;
      }

      &--seleccionado {
        border-color: var(--color-primary-base);
        background-color: var(--color-surface-sunken);
      }

      &__contenido {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      &__titulo {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-main);
      }

      &__desc {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }
    }

    .opciones-clave {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-2);
      margin-bottom: var(--espacio-2);
    }

    .radio-inline {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      cursor: pointer;
    }

    .alerta-error {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      padding: var(--espacio-3);
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      margin-bottom: var(--espacio-4);
    }

    .icono-alerta {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
    }

    .dialogo-acciones {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--espacio-3);
      width: 100%;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--espacio-2);
      height: var(--touch-min);
      padding: 0 var(--espacio-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      border: none;
      transition: background-color var(--trans-fast), opacity var(--trans-fast);

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &--secundario {
        background-color: var(--color-surface-card);
        color: var(--color-text-main);
        border: 1px solid var(--color-border-subtle);

        &:hover:not(:disabled) {
          background-color: var(--color-surface-hover);
        }
      }

      &--primario {
        background-color: var(--color-primary-base);
        color: var(--prim-blanco);

        &:hover:not(:disabled) {
          background-color: var(--color-primary-hover);
        }
      }
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoPersonalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly catalogosStore = inject(CatalogosStore);
  private readonly areasApi = inject(AreasApi);
  private readonly personalStore = inject(PersonalStore);

  readonly personalParaEditar = input<PersonalItem | null>(null);
  readonly idAreaPreseleccionada = input<number | null>(null);

  readonly guardado = output<{
    personal: PersonalItem;
    contrasenaTemporal?: string;
  }>();
  readonly cancelado = output<void>();

  readonly areas = signal<AreaResumen[]>([]);
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);

  form!: FormGroup;

  readonly vistaPreviaNombre = signal<string>('');

  ngOnInit(): void {
    this.catalogosStore.cargar();
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (lista) => this.areas.set(lista),
    });

    const item = this.personalParaEditar();
    const areaIdInicial = item?.idArea ?? this.idAreaPreseleccionada() ?? null;

    this.form = this.fb.group({
      grado: [item ? item.grado : GradoProfesional.SIN_GRADO, [Validators.required]],
      nombres: [item ? item.nombre : '', [Validators.required]],
      apellidos: [item ? item.apellidos : '', [Validators.required]],
      idArea: [areaIdInicial, [Validators.required]],
      correo: [item ? item.correo : '', [Validators.required, Validators.email]],
      nombreUsuario: [item ? item.nombreUsuario : ''],
      rol: [item ? item.rol : 'USUARIO_FINAL', [Validators.required]],
      generarContrasena: [true],
      contrasena: [''],
    });

    this.actualizarVistaPrevia();
  }

  onNombresApellidosChange(): void {
    this.actualizarVistaPrevia();

    if (!this.personalParaEditar()) {
      const nombres = this.form.get('nombres')?.value || '';
      const apellidos = this.form.get('apellidos')?.value || '';

      const pNombre = nombres.trim().split(/\s+/)[0] || '';
      const pApellido = apellidos.trim().split(/\s+/)[0] || '';

      if (pNombre && pApellido) {
        const usuarioSugerido = `${pNombre[0]}${pApellido}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        if (!this.form.get('nombreUsuario')?.dirty) {
          this.form.patchValue({ nombreUsuario: usuarioSugerido });
        }

        if (!this.form.get('correo')?.dirty) {
          this.form.patchValue({ correo: `${usuarioSugerido}@hospital.gob.pe` });
        }
      }
    }
  }

  actualizarVistaPrevia(): void {
    const grado = this.form?.get('grado')?.value;
    const nombres = this.form?.get('nombres')?.value;
    const apellidos = this.form?.get('apellidos')?.value;
    this.vistaPreviaNombre.set(nombreVisible(grado, nombres, apellidos));
  }

  obtenerError(campo: string): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['servidor']) {
      return control.errors['servidor'];
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['email']) {
      return 'Ingrese un correo electrónico válido.';
    }
    return 'Dato no válido.';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const item = this.personalParaEditar();

    if (item) {
      const formAct: PersonalActualizarForm = {
        grado: this.form.value.grado,
        nombres: this.form.value.nombres,
        apellidos: this.form.value.apellidos,
        idArea: Number(this.form.value.idArea),
        rol: this.form.value.rol,
        correo: this.form.value.correo,
        nombreUsuario: this.form.value.nombreUsuario || null,
      };

      this.personalStore.actualizar(item.id, formAct).subscribe({
        next: (act) => {
          this.guardando.set(false);
          this.guardado.emit({ personal: act });
        },
        error: (err) => {
          this.guardando.set(false);
          const msj = aplicarErroresServidor(this.form, err);
          if (msj) this.errorGeneral.set(msj);
        },
      });
    } else {
      const formReg: PersonalRegistroForm = {
        grado: this.form.value.grado,
        nombres: this.form.value.nombres,
        apellidos: this.form.value.apellidos,
        idArea: Number(this.form.value.idArea),
        correo: this.form.value.correo,
        nombreUsuario: this.form.value.nombreUsuario || null,
        rol: this.form.value.rol,
        generarContrasena: !!this.form.value.generarContrasena,
        contrasena: this.form.value.contrasena || null,
      };

      this.personalStore.crear(formReg).subscribe({
        next: (creado) => {
          this.guardando.set(false);
          this.guardado.emit({
            personal: creado,
            contrasenaTemporal: creado.contrasenaTemporal,
          });
        },
        error: (err) => {
          this.guardando.set(false);
          const msj = aplicarErroresServidor(this.form, err);
          if (msj) this.errorGeneral.set(msj);
        },
      });
    }
  }

  cerrar(): void {
    this.cancelado.emit();
  }
}
