import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Miga } from '../../../../nucleo/servicios/migas-pan.service';

@Component({
  selector: 'app-migas-pan',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './migas-pan.component.html',
  styleUrl: './migas-pan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigasPanComponent {
  readonly migas = input<readonly Miga[]>([]);
}
