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
      padding: 2px 7px;
      border-radius: var(--radio-sm, 4px);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      background-color: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;

      &--n2 {
        background-color: #ede9fe;
        color: #5b21b6;
        border-color: #c4b5fd;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NivelInsigniaComponent {
  readonly nivel = input.required<'N1' | 'N2'>();
}
