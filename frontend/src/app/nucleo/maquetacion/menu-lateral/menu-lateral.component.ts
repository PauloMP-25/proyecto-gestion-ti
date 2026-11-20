import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { MENU_POR_ROL } from './menu-por-rol.config';
import { CabeceraMenuMovilComponent } from './componentes/cabecera-menu-movil/cabecera-menu-movil.component';
import { MenuGrupoComponent } from './componentes/menu-grupo/menu-grupo.component';
import { InfoSoportePieComponent } from '../../../compartido/ui/moleculas/info-soporte-pie/info-soporte-pie.component';

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [
    CabeceraMenuMovilComponent,
    MenuGrupoComponent,
    InfoSoportePieComponent,
  ],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cerrarEnMovil()',
  },
})
export class MenuLateralComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);

  readonly rolActual = this.authService.rolActual;
  readonly sidebarAbierto = this.layoutService.sidebarAbierto;
  readonly sidebarColapsado = this.layoutService.sidebarColapsado;

  readonly seccionesMenu = computed(() => {
    const rol = this.rolActual();
    return rol ? MENU_POR_ROL[rol] ?? [] : [];
  });

  alNavegar(): void {
    if (this.layoutService.esMovil()) {
      this.layoutService.cerrarSidebarMovil();
    }
  }

  cerrarEnMovil(): void {
    if (this.sidebarAbierto()) {
      this.layoutService.cerrarSidebarMovil();
    }
  }
}
