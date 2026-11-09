import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-esqueleto',
  standalone: true,
  template: `
    <div 
      class="esqueleto" 
      [style.width]="ancho()" 
      [style.height]="alto()" 
      [style.border-radius]="radio()"
      aria-hidden="true">
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .esqueleto {
      background: linear-gradient(
        90deg,
        rgba(226, 232, 240, 0.6) 0%,
        rgba(241, 245, 249, 0.9) 50%,
        rgba(226, 232, 240, 0.6) 100%
      );
      background-size: 200% 100%;
      animation: esqueleto-shimmer 1.5s infinite;
    }
    @keyframes esqueleto-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EsqueletoComponent {
  readonly ancho = input<string>('100%');
  readonly alto = input<string>('1rem');
  readonly radio = input<string>('var(--radio-sm, 4px)');
}
