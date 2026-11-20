import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ElementRef,
  viewChild,
  AfterViewInit,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'app-dialogo-formulario',
  standalone: true,
  imports: [],
  templateUrl: './dialogo-formulario.component.html',
  styleUrl: './dialogo-formulario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoFormularioComponent implements AfterViewInit {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
  readonly idTitulo = input<string>('dialogo-formulario-titulo');

  readonly cancelar = output<void>();

  private readonly contenedor = viewChild<ElementRef<HTMLDivElement>>('dialogoContenedor');

  ngAfterViewInit(): void {
    // Foco inicial en el primer elemento interactivo
    setTimeout(() => {
      const el = this.contenedor()?.nativeElement;
      const primerInteractuable = el?.querySelector<HTMLElement>(
        'input, select, textarea, button:not(.dialogo-btn-cerrar)'
      );
      if (primerInteractuable) {
        primerInteractuable.focus();
      }
    }, 50);
  }

  @HostListener('window:keydown.escape')
  alPresionarEscape(): void {
    this.cerrar();
  }

  alHacerClicFondo(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cerrar();
    }
  }

  cerrar(): void {
    this.cancelar.emit();
  }
}
