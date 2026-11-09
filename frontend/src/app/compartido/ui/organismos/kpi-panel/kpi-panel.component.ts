import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiIndicador } from '../../../../funcionalidades/panel-control/modelos/kpi.model';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { KpiTarjetaComponent } from '../../moleculas/kpi-tarjeta/kpi-tarjeta.component';

@Component({
  selector: 'app-kpi-panel',
  standalone: true,
  imports: [CommonModule, KpiTarjetaComponent],
  templateUrl: './kpi-panel.component.html',
  styleUrl: './kpi-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiPanelComponent {
  readonly kpis = input.required<KpiIndicador[]>();
  readonly rol = input<RolUsuario | null>(RolUsuario.ADMINISTRADOR);

  readonly RolUsuario = RolUsuario;
}
