import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';

@Component({
  selector: 'app-seccion-identificacion',
  standalone: true,
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './seccion-identificacion.component.html',
  styleUrl: './seccion-identificacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionIdentificacionComponent {
  readonly form = input.required<FormGroup>();

  readonly alCambiarTipo = output<void>();
  readonly alEditarCodigo = output<void>();

  obtenerError(campo: string): string | null {
    const c = this.form().get(campo);
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['required']) return 'Este campo es obligatorio.';
    if (c.errors['maxlength'])
      return `Supera el límite de ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['servidor']) return c.errors['servidor'];

    return 'Dato inválido.';
  }
}
