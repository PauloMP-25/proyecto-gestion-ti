import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';

export type TipoBadgeNav = 'sla-alerta' | 'sla-incumplido' | 'info';

@Component({
  selector: 'app-item-nav',
  standalone: true,
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      [routerLink]="ruta()"
      routerLinkActive="activo"
      [routerLinkActiveOptions]="{ exact: exacto() }"
      class="enlace-menu"
      [class.colapsado]="colapsado()"
      [title]="titulo()"
      (click)="clickItem.emit()"
    >
      <span class="material-symbols-outlined item-icono">{{ icono() }}</span>

      <span class="item-etiqueta" [class.oculto-colapsado]="colapsado()">
        {{ titulo() }}
      </span>

      @if (badge() && !colapsado()) {
        <span class="item-badge" [class]="badgeTipo() ?? 'info'">
          {{ badge() }}
        </span>
      }
    </a>
  `,
  styleUrl: './item-nav.component.scss',
})
export class ItemNavComponent {
  readonly titulo = input.required<string>();
  readonly ruta = input.required<string>();
  readonly icono = input.required<string>();
  readonly badge = input<string | undefined>(undefined);
  readonly badgeTipo = input<TipoBadgeNav | undefined>('info');
  readonly colapsado = input(false);
  readonly exacto = input(false);

  readonly clickItem = output<void>();
}
