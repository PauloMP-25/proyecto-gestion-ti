import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
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
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';

import { IndicadorFortalezaComponent } from './componentes/indicador-fortaleza/indicador-fortaleza.component';
import { RequisitosContrasenaComponent } from './componentes/requisitos-contrasena/requisitos-contrasena.component';

@Component({
  selector: 'app-cambiar-contrasena-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CampoFormularioComponent,
    IndicadorFortalezaComponent,
    RequisitosContrasenaComponent,
  ],
  templateUrl: './cambiar-contrasena.page.html',
  styleUrl: './cambiar-contrasena.page.scss',
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

  readonly valorClaveActual = signal<string>('');

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

  actualizarValorClave(): void {
    this.valorClaveActual.set(this.form.get('nuevaContrasena')?.value || '');
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
