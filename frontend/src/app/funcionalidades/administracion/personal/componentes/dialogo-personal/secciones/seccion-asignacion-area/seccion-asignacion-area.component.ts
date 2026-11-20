import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AreaResumen } from '../../../../../areas/modelos/areas.model';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';

@Component({
  selector: 'app-seccion-asignacion-area',
  standalone: true,
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './seccion-asignacion-area.component.html',
  styleUrl: './seccion-asignacion-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionAsignacionAreaComponent {
  readonly form = input.required<FormGroup>();
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();

  obtenerError(campo: string): string | null {
    const control = this.form().get(campo);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['servidor']) {
      return control.errors['servidor'];
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    return 'Dato no válido.';
  }
}
