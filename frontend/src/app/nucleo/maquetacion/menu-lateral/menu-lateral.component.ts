import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { RolUsuario } from '../../modelos/rol.enum';

export interface ItemMenu {
  titulo: string;
  ruta: string;
  icono: string;
  badge?: string;
  badgeTipo?: 'sla-alerta' | 'sla-incumplido' | 'info';
}

export interface SeccionMenu {
  encabezado?: string;
  items: ItemMenu[];
}

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.scss',
})
export class MenuLateralComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  readonly rolActual = this.authService.rolActual;
  readonly sidebarAbierto = this.layoutService.sidebarAbierto;
  readonly sidebarColapsado = this.layoutService.sidebarColapsado;

  // Secciones y opciones dinámicas estrictamente filtradas según el rol activo
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
            encabezado: 'Gobierno de TI & CMDB',
            items: [
              { titulo: 'Activos y Red (CMDB)', ruta: '/cmdb/activos', icono: 'lan' },
              { titulo: 'Solicitudes de Cambio (RFC)', ruta: '/administracion/cambios', icono: 'change_circle' },
              { titulo: 'Control de SLAs', ruta: '/sla/metricas', icono: 'timer' },
              { titulo: 'Usuarios y Permisos', ruta: '/administracion/usuarios', icono: 'manage_accounts' },
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
