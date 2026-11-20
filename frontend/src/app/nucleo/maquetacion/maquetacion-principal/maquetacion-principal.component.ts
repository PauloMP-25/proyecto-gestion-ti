import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutService } from '../layout.service';
import { BarraSuperiorComponent } from '../barra-superior/barra-superior.component';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral.component';
import { PlantillaLayoutComponent } from '../../../compartido/ui/plantillas/plantilla-layout/plantilla-layout.component';
import { PanelContenidoComponent } from '../panel-contenido/panel-contenido.component';

@Component({
  selector: 'app-maquetacion-principal',
  standalone: true,
  imports: [
    BarraSuperiorComponent,
    MenuLateralComponent,
    PlantillaLayoutComponent,
    PanelContenidoComponent,
  ],
  templateUrl: './maquetacion-principal.component.html',
  styleUrl: './maquetacion-principal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaquetacionPrincipalComponent {
  private readonly layoutService = inject(LayoutService);

  readonly sidebarColapsado = this.layoutService.sidebarColapsado;
}
