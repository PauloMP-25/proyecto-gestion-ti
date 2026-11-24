import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Miga, MigasPanService } from '../../../../nucleo/servicios/migas-pan.service';

@Component({
  selector: 'app-migas-pan',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './migas-pan.component.html',
  styleUrl: './migas-pan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigasPanComponent {
  private readonly migasService = inject(MigasPanService);

  readonly migas = input<readonly Miga[]>([]);

  onNavegarMiga(miga: Miga): void {
    if (miga.ruta) {
      this.migasService.notificarNavegacionMiga(miga);
    }
  }
}

