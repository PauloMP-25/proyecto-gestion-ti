import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PersonalAreaItem } from '../../../../servicios/areas.api';

@Component({
  selector: 'app-area-personal-asignado',
  standalone: true,
  imports: [],
  templateUrl: './area-personal-asignado.component.html',
  styleUrl: './area-personal-asignado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaPersonalAsignadoComponent {
  readonly personal = input.required<readonly PersonalAreaItem[] | PersonalAreaItem[]>();
  readonly areaNombre = input.required<string>();

  readonly alRegistrar = output<void>();
  readonly alReasignar = output<void>();
}
