import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nivel-insignia',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="insignia-nivel" [class.insignia-nivel--n2]="nivel() === 'N2'">
      {{ nivel() === 'N2' ? 'Nivel 2 (Especialista)' : 'Nivel 1 (Mesa)' }}
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }
    .insignia-nivel {
      display: inline-flex;
      align-items: center;
      padding: var(--espacio-2xs) var(--espacio-xs);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.03em;
      background-color: var(--comp-insignia-nivel-n1-bg);
      color: var(--comp-insignia-nivel-n1-texto);
      border: 1px solid var(--comp-insignia-nivel-n1-borde);

      &--n2 {
        background-color: var(--comp-insignia-nivel-n2-bg);
        color: var(--comp-insignia-nivel-n2-texto);
        border-color: var(--comp-insignia-nivel-n2-borde);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelInsigniaComponent {
  readonly nivel = input.required<'N1' | 'N2'>();
}
