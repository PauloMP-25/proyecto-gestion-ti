import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialogo-confirmacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmacion-overlay" (click)="alHacerClicFondo($event)" role="presentation">
      <div
        class="confirmacion-modal"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirmacion-titulo'"
        [attr.aria-describedby]="'confirmacion-mensaje'"
      >
        <header class="confirmacion-cabecera">
          <div class="confirmacion-icono" [class.confirmacion-icono--peligro]="esPeligroso()">
            <span class="icono" aria-hidden="true">
              {{ esPeligroso() ? 'warning' : 'help' }}
            </span>
          </div>
          <h2 id="confirmacion-titulo" class="confirmacion-titulo">{{ titulo() }}</h2>
        </header>

        <div class="confirmacion-cuerpo">
          <p id="confirmacion-mensaje" class="confirmacion-mensaje">{{ mensaje() }}</p>
        </div>

        <footer class="confirmacion-pie">
          <button
            type="button"
            class="btn btn--secundario"
            (click)="alCancelar()"
          >
            {{ textoCancelar() }}
          </button>
          <button
            type="button"
            class="btn"
            [class.btn--peligro]="esPeligroso()"
            [class.btn--primario]="!esPeligroso()"
            (click)="alConfirmar()"
          >
            {{ textoConfirmar() }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .confirmacion-overlay {
      position: fixed;
      inset: 0;
      background-color: var(--comp-dialogo-overlay);
      z-index: var(--comp-dialogo-z);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--espacio-4);
      backdrop-filter: blur(2px);
    }

    .confirmacion-modal {
      background-color: var(--comp-dialogo-bg);
      border-radius: var(--comp-dialogo-radio);
      box-shadow: var(--comp-dialogo-sombra);
      width: 100%;
      max-width: 28rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .confirmacion-cabecera {
      display: flex;
      align-items: center;
      gap: var(--espacio-3);
      padding: var(--espacio-5) var(--espacio-5) var(--espacio-2);
    }

    .confirmacion-icono {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-full);
      background-color: var(--color-surface-sunken);
      color: var(--color-primary-base);
      flex-shrink: 0;

      &--peligro {
        background-color: var(--color-error-bg);
        color: var(--color-error-text);
      }
    }

    .icono {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: 1.5rem;
    }

    .confirmacion-titulo {
      margin: 0;
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-main);
      line-height: 1.3;
    }

    .confirmacion-cuerpo {
      padding: var(--espacio-2) var(--espacio-5) var(--espacio-5);
    }

    .confirmacion-mensaje {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
      line-height: 1.5;
    }

    .confirmacion-pie {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--espacio-3);
      padding: var(--espacio-3) var(--espacio-5);
      background-color: var(--color-surface-sunken);
      border-top: 1px solid var(--color-border-subtle);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: var(--touch-min);
      padding: 0 var(--espacio-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      border: none;
      transition: background-color var(--trans-fast);

      &--secundario {
        background-color: var(--color-surface-card);
        color: var(--color-text-main);
        border: 1px solid var(--color-border-subtle);

        &:hover {
          background-color: var(--color-surface-hover);
        }
      }

      &--primario {
        background-color: var(--color-primary-base);
        color: var(--prim-blanco);

        &:hover {
          background-color: var(--color-primary-hover);
        }
      }

      &--peligro {
        background-color: var(--color-error-text);
        color: var(--prim-blanco);

        &:hover {
          opacity: 0.9;
        }
      }
    }
  `],
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
