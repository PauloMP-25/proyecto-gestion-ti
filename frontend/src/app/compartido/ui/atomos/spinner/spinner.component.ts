import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TamanoSpinner = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="spinner"
      [class.spinner--sm]="tamano() === 'sm'"
      [class.spinner--md]="tamano() === 'md'"
      [class.spinner--lg]="tamano() === 'lg'"
      role="status"
      [attr.aria-label]="etiqueta()">
      <span class="sr-only">{{ etiqueta() }}</span>
    </span>
  `,
  styleUrl: './spinner.component.scss',
})
export class SpinnerComponent {
  readonly tamano = input<TamanoSpinner>('md');
  readonly etiqueta = input<string>('Cargando...');
}
