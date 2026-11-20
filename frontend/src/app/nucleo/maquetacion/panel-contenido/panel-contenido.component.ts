import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MigasPanService } from '../../servicios/migas-pan.service';
import { MigasPanComponent } from '../../../compartido/ui/moleculas/migas-pan/migas-pan.component';

@Component({
  selector: 'app-panel-contenido',
  standalone: true,
  imports: [RouterModule, MigasPanComponent],
  templateUrl: './panel-contenido.component.html',
  styleUrl: './panel-contenido.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelContenidoComponent {
  private readonly migasService = inject(MigasPanService);

  readonly migas = this.migasService.migas;
}
