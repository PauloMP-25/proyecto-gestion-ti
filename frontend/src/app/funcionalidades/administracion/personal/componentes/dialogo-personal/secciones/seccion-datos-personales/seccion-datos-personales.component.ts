import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CatalogosStore } from '../../../../../../../compartido/catalogos/catalogos.store';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';

@Component({
  selector: 'app-seccion-datos-personales',
  standalone: true,
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './seccion-datos-personales.component.html',
  styleUrl: './seccion-datos-personales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionDatosPersonalesComponent {
  readonly catalogosStore = inject(CatalogosStore);

  readonly form = input.required<FormGroup>();
  readonly vistaPreviaNombre = input<string>('');

  readonly alCambiarNombre = output<void>();

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
