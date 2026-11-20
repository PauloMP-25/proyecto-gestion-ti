import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradoProfesional, GRADOS_PROFESIONALES } from '../../../catalogos/grado-profesional.enum';

@Component({
  selector: 'app-insignia-grado',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (etiqueta()) {
      <span class="insignia-grado" [attr.aria-label]="'Grado profesional ' + etiqueta()">
        {{ etiqueta() }}
      </span>
    }
  `,
  styles: [`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }
    .insignia-grado {
      display: inline-flex;
      align-items: center;
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      background-color: var(--color-surface-sunken);
      color: var(--color-text-main);
      border: 1px solid var(--color-border-subtle);
      line-height: 1.2;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsigniaGradoComponent {
  readonly grado = input<GradoProfesional | string | null | undefined>();

  readonly etiqueta = computed(() => {
    const val = this.grado();
    if (!val || val === GradoProfesional.SIN_GRADO || val === 'SIN_GRADO') {
      return null;
    }
    const opcion = GRADOS_PROFESIONALES.find((g) => g.codigo === val);
    return opcion?.etiqueta ?? val;
  });
}
