import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';

@Component({
  selector: 'app-dialogo-contrasena-temporal',
  standalone: true,
  imports: [DialogoFormularioComponent],
  templateUrl: './dialogo-contrasena-temporal.component.html',
  styleUrl: './dialogo-contrasena-temporal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoContrasenaTemporalComponent {
  readonly contrasena = input.required<string>();
  readonly nombreUsuario = input<string | null>();

  readonly cerrado = output<void>();
  readonly copiado = signal<boolean>(false);

  copiar(): void {
    const clave = this.contrasena();
    if (!clave || !navigator.clipboard) return;

    navigator.clipboard.writeText(clave).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }

  cerrar(): void {
    this.cerrado.emit();
  }
}
