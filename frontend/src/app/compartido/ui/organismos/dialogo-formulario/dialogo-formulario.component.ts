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
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialogo-formulario',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="dialogo-overlay"
      (click)="alHacerClicFondo($event)"
      role="presentation"
    >
      <div
        #dialogoContenedor
        class="dialogo-contenedor"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="idTitulo()"
      >
        <header class="dialogo-cabecera">
          <div>
            <h2 [id]="idTitulo()" class="dialogo-titulo">{{ titulo() }}</h2>
            @if (subtitulo()) {
              <p class="dialogo-subtitulo">{{ subtitulo() }}</p>
            }
          </div>
          <button
            type="button"
            class="dialogo-btn-cerrar"
            aria-label="Cerrar diálogo"
            (click)="cerrar()"
          >
            <span class="icono-cerrar" aria-hidden="true">close</span>
          </button>
        </header>

        <div class="dialogo-cuerpo">
          <ng-content select="[cuerpo]"></ng-content>
        </div>

        <footer class="dialogo-pie">
          <ng-content select="[acciones]"></ng-content>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .dialogo-overlay {
      position: fixed;
      inset: 0;
      background-color: var(--comp-dialogo-overlay);
      z-index: var(--comp-dialogo-z);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--espacio-4);
      backdrop-filter: blur(2px);
      animation: fadeIn var(--trans-fast) ease-out;

      @media (max-width: 640px) {
        padding: 0;
      }
    }

    .dialogo-contenedor {
      background-color: var(--comp-dialogo-bg);
      border-radius: var(--comp-dialogo-radio);
      box-shadow: var(--comp-dialogo-sombra);
      width: 100%;
      max-width: var(--comp-dialogo-ancho-md);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: scaleUp var(--trans-normal) cubic-bezier(0.16, 1, 0.3, 1);

      @media (max-width: 640px) {
        max-width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
      }
    }

    .dialogo-cabecera {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--espacio-3);
      padding: var(--comp-dialogo-padding);
      border-bottom: 1px solid var(--color-border-subtle);
      background-color: var(--color-surface-card);
    }

    .dialogo-titulo {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-main);
      line-height: 1.25;
    }

    .dialogo-subtitulo {
      margin: var(--espacio-2xs) 0 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .dialogo-btn-cerrar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--touch-min);
      height: var(--touch-min);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: background-color var(--trans-fast), color var(--trans-fast);

      &:hover,
      &:focus-visible {
        background-color: var(--color-surface-hover);
        color: var(--color-text-main);
        outline: none;
      }
    }

    .icono-cerrar {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-md);
      line-height: 1;
    }

    .dialogo-cuerpo {
      padding: var(--comp-dialogo-padding);
      overflow-y: auto;
      flex: 1 1 auto;
    }

    .dialogo-pie {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--espacio-3);
      padding: var(--espacio-4) var(--comp-dialogo-padding);
      border-top: 1px solid var(--color-border-subtle);
      background-color: var(--color-surface-sunken);
      flex-shrink: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
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
