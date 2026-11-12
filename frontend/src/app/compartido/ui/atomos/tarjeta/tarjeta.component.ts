import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tarjeta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tarjeta"
      [class.tarjeta--interactiva]="interactiva()"
      [style.border-left-color]="acento() ?? null"
      [class.tarjeta--con-acento]="!!acento()">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './tarjeta.component.scss',
})
export class TarjetaComponent {
  readonly interactiva = input<boolean>(false);
  readonly acento = input<string | null>(null);
}
