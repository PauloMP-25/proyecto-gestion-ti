import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SeccionMenu } from '../../menu.model';
import { ItemNavComponent } from '../../../../../compartido/ui/moleculas/item-nav/item-nav.component';

@Component({
  selector: 'app-menu-grupo',
  standalone: true,
  imports: [ItemNavComponent],
  templateUrl: './menu-grupo.component.html',
  styleUrl: './menu-grupo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuGrupoComponent {
  readonly seccion = input.required<SeccionMenu>();
  readonly colapsado = input<boolean>(false);

  readonly alNavegar = output<void>();
}
