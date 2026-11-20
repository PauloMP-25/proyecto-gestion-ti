import {
  Component,
  ChangeDetectionStrategy,
  inject,
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
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { CampoFormularioComponent } from '../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';

@Component({
  selector: 'app-cambiar-contrasena-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CampoFormularioComponent],
  template: `
    <div class="pagina-cambiar-clave">
      <div class="tarjeta-cambio">
        <header class="tarjeta-cambio__cabecera">
          <div class="icono-candado-wrapper" aria-hidden="true">
            <span class="material-symbols-outlined icono-candado">lock_reset</span>
          </div>
          <h1 class="tarjeta-cambio__titulo">Actualización de contraseña</h1>
          <p class="tarjeta-cambio__subtitulo">
            Por política de seguridad institucional, debe definir una nueva contraseña personal antes de continuar en la Mesa de Ayuda.
          </p>
        </header>

        @if (errorGeneral()) {
          <div class="alerta-error" role="alert">
            <span class="material-symbols-outlined icono-alerta" aria-hidden="true">warning</span>
            <span>{{ errorGeneral() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="guardar()" class="formulario-cambio">
          <app-campo-formulario
            etiqueta="Contraseña actual"
            paraId="contrasenaActual"
            [requerido]="true"
            ayuda="Ingrese la clave temporal que le fue asignada"
            [error]="obtenerError('contrasenaActual')"
          >
            <div class="campo-password-wrapper">
              <input
                id="contrasenaActual"
                [type]="mostrarActual() ? 'text' : 'password'"
                formControlName="contrasenaActual"
                placeholder="••••••••••••"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="btn-toggle-password"
                (click)="mostrarActual.set(!mostrarActual())"
                [attr.aria-label]="mostrarActual() ? 'Ocultar contraseña' : 'Ver contraseña'"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ mostrarActual() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </app-campo-formulario>

          <app-campo-formulario
            etiqueta="Nueva contraseña personal"
            paraId="nuevaContrasena"
            [requerido]="true"
            ayuda="Mínimo 8 caracteres, al menos una mayúscula, minúscula y un número"
            [error]="obtenerError('nuevaContrasena')"
          >
            <div class="campo-password-wrapper">
              <input
                id="nuevaContrasena"
                [type]="mostrarNueva() ? 'text' : 'password'"
                formControlName="nuevaContrasena"
                placeholder="••••••••••••"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="btn-toggle-password"
                (click)="mostrarNueva.set(!mostrarNueva())"
                [attr.aria-label]="mostrarNueva() ? 'Ocultar contraseña' : 'Ver contraseña'"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ mostrarNueva() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </app-campo-formulario>

          <!-- Medidor de fortaleza -->
          <div class="medidor-requisitos" aria-live="polite">
            <div class="requisito-item" [class.cumplido]="tieneLongitudMinima()">
              <span class="material-symbols-outlined icono-req" aria-hidden="true">
                {{ tieneLongitudMinima() ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span>Mínimo 8 caracteres</span>
            </div>
            <div class="requisito-item" [class.cumplido]="tieneMayuscula()">
              <span class="material-symbols-outlined icono-req" aria-hidden="true">
                {{ tieneMayuscula() ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span>Al menos una letra mayúscula</span>
            </div>
            <div class="requisito-item" [class.cumplido]="tieneMinuscula()">
              <span class="material-symbols-outlined icono-req" aria-hidden="true">
                {{ tieneMinuscula() ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span>Al menos una letra minúscula</span>
            </div>
            <div class="requisito-item" [class.cumplido]="tieneNumero()">
              <span class="material-symbols-outlined icono-req" aria-hidden="true">
                {{ tieneNumero() ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span>Al menos un número (0-9)</span>
            </div>
          </div>

          <app-campo-formulario
            etiqueta="Confirmar nueva contraseña"
            paraId="confirmarContrasena"
            [requerido]="true"
            [error]="obtenerError('confirmarContrasena')"
          >
            <div class="campo-password-wrapper">
              <input
                id="confirmarContrasena"
                [type]="mostrarConfirmar() ? 'text' : 'password'"
                formControlName="confirmarContrasena"
                placeholder="••••••••••••"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="btn-toggle-password"
                (click)="mostrarConfirmar.set(!mostrarConfirmar())"
                [attr.aria-label]="mostrarConfirmar() ? 'Ocultar contraseña' : 'Ver contraseña'"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  {{ mostrarConfirmar() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </app-campo-formulario>

          <div class="acciones-formulario">
            <button
              type="submit"
              class="btn-actualizar"
              [disabled]="form.invalid || guardando()"
            >
              @if (guardando()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Actualizando contraseña...</span>
              } @else {
                <span>Actualizar contraseña y continuar</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .pagina-cambiar-clave {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 8rem);
        padding: var(--espacio-6);
        background-color: var(--color-surface-bg);
      }

      .tarjeta-cambio {
        width: 100%;
        max-width: 32rem;
        background-color: var(--color-surface-card);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        padding: var(--espacio-8);
        box-shadow: var(--shadow-md);
      }

      .tarjeta-cambio__cabecera {
        text-align: center;
        margin-bottom: var(--espacio-6);
      }

      .icono-candado-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: var(--radius-full);
        background-color: var(--color-brand-muted);
        color: var(--color-brand-primary);
        margin-bottom: var(--espacio-3);
      }

      .icono-candado {
        font-size: 2rem;
      }

      .tarjeta-cambio__titulo {
        font-size: var(--tipo-titulo-md-size);
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0 0 var(--espacio-2) 0;
      }

      .tarjeta-cambio__subtitulo {
        font-size: var(--tipo-cuerpo-sm-size);
        color: var(--color-text-muted);
        line-height: 1.5;
        margin: 0;
      }

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
        font-size: 1.25rem;
      }

      .formulario-cambio {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-4);
      }

      .campo-password-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      input[type='text'],
      input[type='password'] {
        width: 100%;
        padding: var(--espacio-2) var(--espacio-3);
        padding-right: 2.75rem;
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

      .btn-toggle-password {
        position: absolute;
        right: var(--espacio-2);
        background: transparent;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--espacio-1);

        &:hover {
          color: var(--color-text-primary);
        }

        .material-symbols-outlined {
          font-size: 1.25rem;
        }
      }

      .medidor-requisitos {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-1);
        padding: var(--espacio-3);
        background-color: var(--color-surface-subtle);
        border-radius: var(--radius-sm);
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
      }

      .requisito-item {
        display: flex;
        align-items: center;
        gap: var(--espacio-1);

        .icono-req {
          font-size: 1rem;
        }

        &.cumplido {
          color: var(--color-success-text);
          font-weight: 500;
        }
      }

      .acciones-formulario {
        margin-top: var(--espacio-2);
      }

      .btn-actualizar {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--espacio-2);
        padding: var(--espacio-3);
        background-color: var(--color-brand-primary);
        color: var(--color-text-inverse);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--tipo-cuerpo-sm-size);
        font-weight: 600;
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
        width: 1.2rem;
        height: 1.2rem;
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
export class CambiarContrasenaPage {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificacion = inject(NotificacionService);

  readonly mostrarActual = signal<boolean>(false);
  readonly mostrarNueva = signal<boolean>(false);
  readonly mostrarConfirmar = signal<boolean>(false);
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group(
    {
      contrasenaActual: ['', [Validators.required]],
      nuevaContrasena: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      ],
      confirmarContrasena: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const nueva = group.get('nuevaContrasena')?.value;
        const conf = group.get('confirmarContrasena')?.value;
        return nueva === conf ? null : { noCoincide: true };
      },
    }
  );

  readonly valorNueva = computed(() => {
    // Escuchar el valor del formulario
    return this.form.get('nuevaContrasena')?.value || '';
  });

  tieneLongitudMinima(): boolean {
    const v = this.form.get('nuevaContrasena')?.value || '';
    return v.length >= 8;
  }

  tieneMayuscula(): boolean {
    const v = this.form.get('nuevaContrasena')?.value || '';
    return /[A-Z]/.test(v);
  }

  tieneMinuscula(): boolean {
    const v = this.form.get('nuevaContrasena')?.value || '';
    return /[a-z]/.test(v);
  }

  tieneNumero(): boolean {
    const v = this.form.get('nuevaContrasena')?.value || '';
    return /\d/.test(v);
  }

  obtenerError(campo: string): string | null {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) {
      if (
        campo === 'confirmarContrasena' &&
        this.form.touched &&
        this.form.errors?.['noCoincide']
      ) {
        return 'Las contraseñas no coinciden.';
      }
      return null;
    }

    if (c.errors['required']) return 'Este campo es obligatorio.';
    if (c.errors['minlength']) return 'Debe tener al menos 8 caracteres.';
    if (c.errors['pattern'])
      return 'Debe incluir al menos una mayúscula, una minúscula y un número.';

    return 'Dato inválido.';
  }

  guardar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const { contrasenaActual, nuevaContrasena } = this.form.value;

    this.http
      .put(API_ENDPOINTS.cuenta.contrasena, {
        contrasenaActual,
        nuevaContrasena,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.authService.marcarContrasenaCambiada();
          this.notificacion.exito(
            'Su contraseña ha sido actualizada exitosamente. Bienvenido(a) al sistema.'
          );
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.guardando.set(false);
          const msj =
            err?.error?.mensaje ||
            'No se pudo actualizar la contraseña. Verifique que la contraseña actual sea la correcta.';
          this.errorGeneral.set(msj);
        },
      });
  }
}
