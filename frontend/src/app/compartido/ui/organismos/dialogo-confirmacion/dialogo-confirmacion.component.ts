import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  imports: [],
  templateUrl: './dialogo-confirmacion.component.html',
  styleUrl: './dialogo-confirmacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoConfirmacionComponent {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly textoConfirmar = input<string>('Confirmar');
  readonly textoCancelar = input<string>('Cancelar');
  readonly esPeligroso = input<boolean>(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  @HostListener('window:keydown.escape')
  alEscape(): void {
    this.alCancelar();
  }

  alHacerClicFondo(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.alCancelar();
    }
  }

  alConfirmar(): void {
    this.confirmar.emit();
  }

  alCancelar(): void {
    this.cancelar.emit();
  }
}
