import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';

@Component({
  selector: 'app-seccion-credenciales',
  standalone: true,
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './seccion-credenciales.component.html',
  styleUrl: './seccion-credenciales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCredencialesComponent {
  readonly form = input.required<FormGroup>();
  readonly esEdicion = input<boolean>(false);

  obtenerError(campo: string): string | null {
    const control = this.form().get(campo);
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
}
