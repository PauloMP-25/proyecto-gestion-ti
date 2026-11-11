import { Directive, ElementRef, HostListener, OnDestroy, OnInit, inject, output } from '@angular/core';

const SELECTOR_FOCABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

@Directive({
  selector: '[appDialogoAccesible]',
  standalone: true,
})
export class DialogoAccesibleDirective implements OnInit, OnDestroy {
  readonly alCerrar = output<void>();
  private host = inject(ElementRef<HTMLElement>);
  private elementoPrevio: HTMLElement | null = null;

  ngOnInit(): void {
    this.elementoPrevio = document.activeElement as HTMLElement | null;
    this.focables()[0]?.focus();
  }

  ngOnDestroy(): void {
    this.elementoPrevio?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(evento: KeyboardEvent): void {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      this.alCerrar.emit();
      return;
    }
    if (evento.key !== 'Tab') return;

    const focables = this.focables();
    if (focables.length === 0) return;
    const primero = focables[0];
    const ultimo = focables[focables.length - 1];
    const activo = document.activeElement;

    if (evento.shiftKey && activo === primero) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && activo === ultimo) {
      evento.preventDefault();
      primero.focus();
    }
  }

  private focables(): HTMLElement[] {
    const raiz = this.host.nativeElement as HTMLElement;
    return Array.from(raiz.querySelectorAll<HTMLElement>(SELECTOR_FOCABLE))
      .filter(el => !el.hasAttribute('disabled'));
  }
}