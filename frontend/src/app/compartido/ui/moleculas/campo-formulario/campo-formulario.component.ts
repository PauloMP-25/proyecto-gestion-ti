import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campo-formulario',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="campo-formulario" [class.campo-formulario--error]="!!error()">
      @if (etiqueta()) {
        <label [attr.for]="paraId()" class="campo-formulario__label">
          <span>{{ etiqueta() }}</span>
          @if (requerido()) {
            <span class="campo-formulario__requerido" aria-hidden="true">*</span>
          }
        </label>
      }

      <div class="campo-formulario__control">
        <ng-content></ng-content>
      </div>

      @if (error()) {
        <p class="campo-formulario__error" role="alert" [id]="paraId() ? paraId() + '-error' : null">
          <span class="campo-formulario__icono-error" aria-hidden="true">error</span>
          <span>{{ error() }}</span>
        </p>
      } @else if (ayuda()) {
        <p class="campo-formulario__ayuda" [id]="paraId() ? paraId() + '-ayuda' : null">
          {{ ayuda() }}
        </p>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: var(--espacio-4);
    }
    .campo-formulario {
      display: flex;
      flex-direction: column;
      gap: var(--espacio-xs);

      &__label {
        display: flex;
        align-items: center;
        gap: var(--espacio-2xs);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-main);
      }

      &__requerido {
        color: var(--comp-campo-error-color);
        font-weight: var(--font-weight-bold);
      }

      &__control {
        position: relative;
        width: 100%;

        ::ng-deep input,
        ::ng-deep select,
        ::ng-deep textarea {
          width: 100%;
          min-height: var(--comp-campo-altura);
          background-color: var(--comp-campo-bg);
          border: var(--comp-campo-borde);
          border-radius: var(--comp-campo-radio);
          padding: var(--espacio-2) var(--espacio-3);
          font-family: inherit;
          font-size: var(--font-size-sm);
          color: var(--comp-campo-texto);
          transition: border-color var(--trans-fast), box-shadow var(--trans-fast);
          box-sizing: border-box;

          &::placeholder {
            color: var(--comp-campo-placeholder);
          }

          &:focus-visible {
            outline: none;
            border-color: var(--color-primary-base);
            box-shadow: 0 0 0 2px var(--color-primary-sunken);
          }
        }

        ::ng-deep textarea {
          min-height: calc(var(--comp-campo-altura) * 1.8);
          resize: vertical;
        }
      }

      &--error &__control {
        ::ng-deep input,
        ::ng-deep select,
        ::ng-deep textarea {
          border-color: var(--comp-campo-error-color);
          &:focus-visible {
            box-shadow: 0 0 0 2px var(--color-error-bg);
          }
        }
      }

      &__error {
        display: flex;
        align-items: center;
        gap: var(--espacio-2xs);
        font-size: var(--font-size-xs);
        color: var(--comp-campo-error-color);
        margin: 0;
        font-weight: var(--font-weight-medium);
      }

      &__icono-error {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: var(--font-size-sm);
        line-height: 1;
      }

      &__ayuda {
        font-size: var(--font-size-xs);
        color: var(--comp-campo-ayuda-color);
        margin: 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampoFormularioComponent {
  readonly etiqueta = input<string>();
  readonly paraId = input<string>();
  readonly requerido = input<boolean>(false);
  readonly ayuda = input<string | null>();
  readonly error = input<string | null>();
}
