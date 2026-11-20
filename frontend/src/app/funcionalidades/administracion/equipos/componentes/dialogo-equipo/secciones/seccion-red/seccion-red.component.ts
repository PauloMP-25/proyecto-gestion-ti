import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';

@Component({
  selector: 'app-seccion-red',
  standalone: true,
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './seccion-red.component.html',
  styleUrl: './seccion-red.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionRedComponent {
  readonly form = input.required<FormGroup>();

  obtenerError(campo: string): string | null {
    const c = this.form().get(campo);
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['maxlength'])
      return `Supera el límite de ${c.errors['maxlength'].requiredLength} caracteres.`;
    if (c.errors['pattern']) return 'Formato inválido (ej: AA:BB:CC:DD:EE:FF).';
    if (c.errors['servidor']) return c.errors['servidor'];

    return 'Dato inválido.';
  }

  obtenerErrorIp(): string | null {
    const c = this.form().get('ipEstatica');
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['formatoInvalido']) return c.errors['formatoInvalido'];
    if (c.errors['ipEnUso']) return c.errors['ipEnUso'];
    if (c.errors['servidor']) return c.errors['servidor'];

    return 'Dirección IP no válida.';
  }
}
