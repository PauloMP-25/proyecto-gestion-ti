import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { BotonHamburguesaComponent } from './componentes/boton-hamburguesa/boton-hamburguesa.component';
import { MarcaHospitalComponent } from '../../../compartido/ui/moleculas/marca-hospital/marca-hospital.component';
import { AlternadorTemaComponent } from './componentes/alternador-tema/alternador-tema.component';
import { CampanaNotificacionesComponent, NotificacionResumen } from './componentes/campana-notificaciones/campana-notificaciones.component';
import { UsuarioPerfilMenuComponent } from '../../../compartido/ui/moleculas/usuario-perfil-menu/usuario-perfil-menu.component';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  imports: [
    BotonHamburguesaComponent,
    MarcaHospitalComponent,
    AlternadorTemaComponent,
    CampanaNotificacionesComponent,
    UsuarioPerfilMenuComponent,
  ],
  templateUrl: './barra-superior.component.html',
  styleUrl: './barra-superior.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraSuperiorComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);

  readonly usuarioActual = this.authService.usuarioActual;
  readonly esMovil = this.layoutService.esMovil;
  readonly sidebarAbierto = this.layoutService.sidebarAbierto;
  readonly sidebarColapsado = this.layoutService.sidebarColapsado;

  // Estado del botón hamburguesa: en móvil si está abierto; en escritorio si NO está colapsado
  readonly expandido = computed(() => {
    return this.esMovil() ? this.sidebarAbierto() : !this.sidebarColapsado();
  });

  // Notificaciones de ejemplo para la campana de atención
  readonly notificaciones: readonly NotificacionResumen[] = [];

  alternarSidebar(): void {
    this.layoutService.alternarSidebar();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }
}
