import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { RolUsuario } from '../../modelos/rol.enum';
import { ItemNavComponent, TipoBadgeNav } from '../../../compartido/ui/moleculas/item-nav/item-nav.component';
import { MarcaHospitalComponent } from '../../../compartido/ui/moleculas/marca-hospital/marca-hospital.component';
import { InfoSoportePieComponent } from '../../../compartido/ui/moleculas/info-soporte-pie/info-soporte-pie.component';

export interface ItemMenu {
  titulo: string;
  ruta: string;
  icono: string;
  badge?: string;
  badgeTipo?: TipoBadgeNav;
}

export interface SeccionMenu {
  encabezado?: string;
  items: ItemMenu[];
}

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ItemNavComponent,
    MarcaHospitalComponent,
    InfoSoportePieComponent,
  ],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
})
export class MenuLateralComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  readonly rolActual = this.authService.rolActual;
  readonly sidebarAbierto = this.layoutService.sidebarAbierto;
  readonly sidebarColapsado = this.layoutService.sidebarColapsado;

  readonly seccionesMenu = computed<SeccionMenu[]>(() => {
    const rol = this.rolActual();
    if (!rol) return [];

    switch (rol) {
      case RolUsuario.USUARIO_FINAL:
        return [
          {
            encabezado: 'Atención Asistencial',
            items: [
              { titulo: 'Inicio', ruta: '/portal', icono: 'home' },
              { titulo: 'Reportar un problema', ruta: '/solicitudes/nuevo', icono: 'add_circle' },
              { titulo: 'Mis solicitudes', ruta: '/portal/mis-solicitudes', icono: 'receipt_long' },
              { titulo: 'Ayuda rápida', ruta: '/portal/ayuda', icono: 'live_help' },
            ],
          },
        ];

      case RolUsuario.PRACTICANTE:
        return [
          {
            encabezado: 'Mesa de Ayuda (Mi Turno)',
            items: [
              { titulo: 'Mi turno', ruta: '/mi-turno', icono: 'schedule' },
              { titulo: 'Consultar equipos y soluciones', ruta: '/mi-turno/consulta', icono: 'search' },
              { titulo: 'Registrar para un tercero', ruta: '/solicitudes/nuevo', icono: 'add_circle' },
              {
                titulo: 'Bandeja general',
                ruta: '/incidentes/bandeja',
                icono: 'inbox',
              },
              {
                titulo: 'Incidentes críticos',
                ruta: '/incidentes/criticos',
                icono: 'warning',
              },
              { titulo: 'Monitor de compromisos', ruta: '/sla/metricas', icono: 'timer' },
              { titulo: 'Panel de control', ruta: '/panel-control', icono: 'dashboard' },
            ],
          },
        ];

      case RolUsuario.ADMINISTRADOR:
        return [
          {
            encabezado: 'Jefatura y Operaciones N2',
            items: [
              { titulo: 'Panel de Control', ruta: '/panel-control', icono: 'dashboard' },
              { titulo: 'Bandeja de Tickets', ruta: '/incidentes/bandeja', icono: 'inbox' },
              {
                titulo: 'Incidentes Críticos (P1/P2)',
                ruta: '/incidentes/criticos',
                icono: 'warning',
                badge: '2 P1',
                badgeTipo: 'sla-incumplido',
              },
              { titulo: 'Matriz de Prioridad', ruta: '/administracion/matriz-prioridad', icono: 'grid_on' },
            ],
          },
          {
            encabezado: 'Administración Hospitalaria',
            items: [
              { titulo: 'Áreas del hospital', ruta: '/administracion/areas', icono: 'apartment' },
              { titulo: 'Personal y cuentas', ruta: '/administracion/personal', icono: 'group' },
              { titulo: 'Equipos e impresoras', ruta: '/administracion/equipos', icono: 'devices' },
            ],
          },
          {
            encabezado: 'Gobierno de TI & CMDB',
            items: [
              { titulo: 'Activos y Red (CMDB)', ruta: '/cmdb/activos', icono: 'lan' },
              { titulo: 'Solicitudes de Cambio (RFC)', ruta: '/administracion/cambios', icono: 'change_circle' },
              { titulo: 'Centro de Soluciones (KEDB)', ruta: '/administracion/conocimiento', icono: 'menu_book' },
              { titulo: 'Compromisos de Atención', ruta: '/administracion/sla-config', icono: 'tune' },
            ],
          },
        ];

      default:
        return [];
    }
  });

  cerrarSidebarMovil(): void {
    this.layoutService.cerrarSidebarMovil();
  }
}
