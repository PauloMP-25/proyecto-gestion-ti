import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelControlService } from '../../servicios/panel-control.service';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-distribucion-tipo',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './distribucion-tipo.component.html',
  styleUrl: './distribucion-tipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistribucionTipoComponent {
  private panelService = inject(PanelControlService);

  readonly distribucion = this.panelService.distribucionPorTipo;
}
