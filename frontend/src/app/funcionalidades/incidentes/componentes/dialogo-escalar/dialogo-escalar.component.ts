import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogoAccesibleDirective } from '../../../../compartido/directivas/dialogo-accesible.directive';

@Component({
  selector: 'app-dialogo-escalar',
  imports: [ReactiveFormsModule, DialogoAccesibleDirective],
  templateUrl: './dialogo-escalar.component.html',
  styleUrl: './dialogo-escalar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoEscalarComponent {
  private fb = inject(FormBuilder);

  readonly codigo = input.required<string>();
  readonly procesando = input(false);
  readonly alConfirmar = output<string>();
  readonly alCancelar = output<void>();

  readonly formulario = this.fb.group({
    motivo: this.fb.control('', [Validators.required, Validators.minLength(20), Validators.maxLength(300)]),
  });

  confirmar(): void {
    if (this.formulario.invalid || this.procesando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.alConfirmar.emit(this.formulario.getRawValue().motivo!.trim());
  }
}