import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';

@Component({
  selector: 'app-dialogo-contrasena-temporal',
  standalone: true,
  imports: [CommonModule, DialogoFormularioComponent],
  template: `
    <app-dialogo-formulario
      titulo="Contraseña temporal generada"
      subtitulo="Credencial provisional de primer acceso hospitalario."
      (cancelar)="cerrar()"
    >
      <div class="cuerpo-clave" cuerpo>
        <div class="aviso-seguridad" role="alert">
          <span class="icono-aviso" aria-hidden="true">lock_reset</span>
          <div class="texto-aviso">
            <p class="aviso-titulo">Entréguela personalmente al colaborador.</p>
            <p class="aviso-desc">
              El sistema exigirá el cambio obligatorio de contraseña en su primer inicio de sesión.
              <strong>Esta clave no se volverá a mostrar en pantalla.</strong>
            </p>
          </div>
        </div>

        <div class="tarjeta-clave">
          <span class="etiqueta-clave">Contraseña provisional:</span>
          <div class="fila-clave">
            <code class="codigo-clave">{{ contrasena() }}</code>
            <button
              type="button"
              class="btn-copiar"
              (click)="copiar()"
              [attr.aria-label]="copiado() ? 'Contraseña copiada' : 'Copiar contraseña al portapapeles'"
              [title]="copiado() ? '¡Copiado!' : 'Copiar al portapapeles'"
            >
              <span class="icono-btn" aria-hidden="true">
                {{ copiado() ? 'check' : 'content_copy' }}
              </span>
              <span>{{ copiado() ? 'Copiado' : 'Copiar' }}</span>
            </button>
          </div>
        </div>

        @if (nombreUsuario()) {
          <p class="info-usuario">
            Usuario asignado: <strong>{{ nombreUsuario() }}</strong>
          </p>
        }
      </div>

      <div class="dialogo-acciones" acciones>
        <button
          type="button"
          class="btn btn--primario"
          (click)="cerrar()"
        >
          Entendido y entregado
        </button>
      </div>
    </app-dialogo-formulario>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .cuerpo-clave {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-4);
    }

    .aviso-seguridad {
      display: flex;
      align-items: flex-start;
      gap: var(--espacio-3);
      padding: var(--espacio-3) var(--espacio-4);
      background-color: var(--color-surface-sunken);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      color: var(--color-text-main);
    }

    .icono-aviso {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: 1.5rem;
      color: var(--color-primary-base);
      flex-shrink: 0;
    }

    .texto-aviso {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-2xs);

      .aviso-titulo {
        margin: 0;
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-sm);
      }

      .aviso-desc {
        margin: 0;
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        line-height: 1.4;
      }
    }

    .tarjeta-clave {
      background-color: var(--color-surface-card);
      border: 2px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
      padding: var(--espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--espacio-2);
    }

    .etiqueta-clave {
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-medium);
    }

    .fila-clave {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--espacio-3);
      background-color: var(--color-surface-sunken);
      padding: var(--espacio-2) var(--espacio-3);
      border-radius: var(--radius-md);
    }

    .codigo-clave {
      font-family: monospace;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-base);
      letter-spacing: 0.08em;
    }

    .btn-copiar {
      display: inline-flex;
      align-items: center;
      gap: var(--espacio-xs);
      height: 2rem;
      padding: 0 var(--espacio-3);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-card);
      color: var(--color-text-main);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: background-color var(--trans-fast);

      &:hover {
        background-color: var(--color-surface-hover);
      }
    }

    .icono-btn {
      font-family: 'Material Symbols Outlined', sans-serif;
      font-size: var(--font-size-sm);
    }

    .info-usuario {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
    }

    .dialogo-acciones {
      display: flex;
      justify-content: flex-end;
      width: 100%;
    }

    .btn {
      height: var(--touch-min);
      padding: 0 var(--espacio-5);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;

      &--primario {
        background-color: var(--color-primary-base);
        color: var(--prim-blanco);

        &:hover {
          background-color: var(--color-primary-hover);
        }
      }
    }
  `],
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
