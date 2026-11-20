import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-etiqueta-ip',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ip()) {
      <div class="etiqueta-ip" [class.etiqueta-ip--copiado]="copiado()">
        <code class="etiqueta-ip__codigo">{{ ip() }}</code>
        @if (copiable()) {
          <button
            type="button"
            class="etiqueta-ip__btn"
            [attr.aria-label]="'Copiar dirección IP ' + ip()"
            (click)="copiar()"
            [title]="copiado() ? '¡Copiado!' : 'Copiar IP'"
          >
            <span class="etiqueta-ip__icono" aria-hidden="true">
              {{ copiado() ? 'check' : 'content_copy' }}
            </span>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    .etiqueta-ip {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      background-color: var(--color-surface-sunken);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      padding: var(--espacio-2xs) var(--espacio-xs);
      transition: border-color var(--trans-fast);

      &--copiado {
        border-color: var(--color-secondary-base);
      }

      &__codigo {
        font-family: monospace;
        font-size: var(--font-size-xs);
        color: var(--color-text-main);
        letter-spacing: 0.04em;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        color: var(--color-text-muted);
        border-radius: var(--radius-xs);
        transition: color var(--trans-fast);

        &:hover,
        &:focus-visible {
          color: var(--color-text-main);
          outline: none;
        }
      }

      &__icono {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: var(--font-size-sm);
        line-height: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtiquetaIpComponent {
  readonly ip = input.required<string | null | undefined>();
  readonly copiable = input<boolean>(true);

  readonly copiado = signal<boolean>(false);

  copiar(): void {
    const direccion = this.ip();
    if (!direccion || !navigator.clipboard) return;

    navigator.clipboard.writeText(direccion).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
