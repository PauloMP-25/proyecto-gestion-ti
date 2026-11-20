import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-info-soporte-pie',
  standalone: true,
  templateUrl: './info-soporte-pie.component.html',
  styleUrl: './info-soporte-pie.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoSoportePieComponent {
  readonly colapsado = input<boolean>(false);
  readonly titulo = input<string>('Mesa de Ayuda');
  readonly anexo = input<string>('2400');
}
