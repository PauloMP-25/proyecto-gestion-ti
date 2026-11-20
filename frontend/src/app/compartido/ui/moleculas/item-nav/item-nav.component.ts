import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

export type TipoBadgeNav = 'sla-alerta' | 'sla-incumplido' | 'info' | 'peligro' | 'aviso' | 'neutro';

@Component({
  selector: 'app-item-nav',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './item-nav.component.html',
  styleUrl: './item-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNavComponent {
  readonly titulo = input.required<string>();
  readonly ruta = input.required<string>();
  readonly icono = input.required<string>();
  readonly badge = input<string | number | undefined>(undefined);
  readonly badgeTipo = input<TipoBadgeNav | undefined>('info');
  readonly colapsado = input<boolean>(false);
  readonly exacto = input<boolean>(false);

  readonly alNavegar = output<void>();
  readonly clickItem = this.alNavegar;
}
