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
import { AreaDetalle, AreaFormulario, PISOS_HOSPITALARIOS } from '../../modelos/areas.model';
import { AreasStore } from '../../estado/areas.store';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';

@Component({
  selector: 'app-dialogo-area',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  template: `
    <app-dialogo-formulario
      [titulo]="areaParaEditar() ? 'Editar área' : 'Nueva área hospitalaria'"
      [subtitulo]="
        areaParaEditar()
          ? 'Actualice los datos de ubicación, anexo y encargado del servicio.'
          : 'Registre el servicio hospitalario, su nivel de piso y referencia física.'
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

        <app-campo-formulario
          etiqueta="Nombre del área"
          paraId="nombreArea"
          [requerido]="true"
          ayuda="Ejemplo: Admisión, Emergencia, Farmacia Central."
          [error]="obtenerError('nombre')"
        >
          <input
            id="nombreArea"
            type="text"
            formControlName="nombre"
            placeholder="Ingrese el nombre del área"
            maxlength="80"
            autocomplete="off"
          />
        </app-campo-formulario>

        <div class="grid-dos-columnas">
          <app-campo-formulario
            etiqueta="Piso"
            paraId="pisoArea"
            ayuda="Nivel físico del hospital."
            [error]="obtenerError('piso')"
          >
            <select id="pisoArea" formControlName="piso">
              @for (p of pisos; track p.valor) {
                <option [ngValue]="p.valor">{{ p.etiqueta }}</option>
              }
            </select>
          </app-campo-formulario>

          <app-campo-formulario
            etiqueta="Anexo telefónico"
            paraId="anexoArea"
            ayuda="Solo dígitos (interno)."
            [error]="obtenerError('anexo')"
          >
            <input
              id="anexoArea"
              type="text"
              formControlName="anexo"
              placeholder="Ej. 105"
              maxlength="20"
              inputmode="numeric"
            />
          </app-campo-formulario>
        </div>

        <app-campo-formulario
          etiqueta="Referencia de ubicación"
          paraId="referenciaArea"
          ayuda="Ejemplo: Frente a la Oficina de la Jefatura de Estadística."
          [error]="obtenerError('referenciaUbicacion')"
        >
          <textarea
            id="referenciaArea"
            formControlName="referenciaUbicacion"
            rows="2"
            maxlength="150"
            placeholder="Detalle puntos de referencia visibles para guiar al técnico..."
          ></textarea>
        </app-campo-formulario>
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
            <span>{{ areaParaEditar() ? 'Actualizar área' : 'Registrar área' }}</span>
          }
        </button>
      </div>
    </app-dialogo-formulario>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .grid-dos-columnas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--espacio-4);

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 0;
      }
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
export class DialogoAreaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AreasStore);

  readonly areaParaEditar = input<AreaDetalle | null>(null);
  readonly cerrado = output<boolean>();

  readonly pisos = PISOS_HOSPITALARIOS;
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    const area = this.areaParaEditar();
    this.form = this.fb.group({
      nombre: [
        area ? area.nombre : '',
        [Validators.required, Validators.maxLength(80)],
      ],
      piso: [area ? area.piso : null],
      referenciaUbicacion: [
        area ? area.referenciaUbicacion : '',
        [Validators.maxLength(150)],
      ],
      anexo: [
        area ? area.anexo : '',
        [Validators.maxLength(20), Validators.pattern(/^[0-9]*$/)],
      ],
      idEncargado: [area?.encargado ? area.encargado.id : null],
    });
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
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `No puede superar ${max} caracteres.`;
    }
    if (control.errors['pattern']) {
      return 'Solo se admiten dígitos numéricos.';
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

    const valorForm: AreaFormulario = {
      nombre: this.form.value.nombre,
      piso: this.form.value.piso,
      referenciaUbicacion: this.form.value.referenciaUbicacion,
      anexo: this.form.value.anexo,
      idEncargado: this.form.value.idEncargado,
    };

    const areaActual = this.areaParaEditar();
    const accion$ = areaActual
      ? this.store.actualizar(areaActual.id, valorForm)
      : this.store.crear(valorForm);

    accion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrado.emit(true);
      },
      error: (err) => {
        this.guardando.set(false);
        const msj = aplicarErroresServidor(this.form, err);
        // Si no se asignó a un campo específico (como nombre), mostrar alerta general
        if (msj && !this.form.get('nombre')?.hasError('servidor')) {
          this.errorGeneral.set(msj);
        }
      },
    });
  }

  cerrar(): void {
    this.cerrado.emit(false);
  }
}
