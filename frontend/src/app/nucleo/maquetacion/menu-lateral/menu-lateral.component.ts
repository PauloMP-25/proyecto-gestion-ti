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
            encabezado: 'Atención y Autoservicio',
            items: [
              { titulo: 'Inicio / Panel', ruta: '/panel-control', icono: 'home' },
              { titulo: 'Registrar Nuevo Ticket', ruta: '/solicitudes/nuevo', icono: 'add_circle' },
              { titulo: 'Mis Tickets Activos', ruta: '/solicitudes/mis-tickets', icono: 'receipt_long' },
              { titulo: 'Base de Conocimiento', ruta: '/base-conocimiento', icono: 'menu_book' },
            ],
          },
        ];

      case RolUsuario.PRACTICANTE:
        return [
          {
            encabezado: 'Mesa de Ayuda (Nivel 1)',
            items: [
              { titulo: 'Dashboard N1', ruta: '/panel-control', icono: 'speed' },
              { 
                titulo: 'Bandeja General Tickets', 
                ruta: '/incidentes/bandeja', 
                icono: 'inbox',
                badge: '12 Activos',
                badgeTipo: 'info'
              },
              { titulo: 'Tickets Asignados a Mí', ruta: '/incidentes/mis-asignaciones', icono: 'assignment_ind' },
            ],
          },
          {
            encabezado: 'Resolución y Diagnóstico',
            items: [
              { titulo: 'Errores Conocidos (KEDB)', ruta: '/errores/kedb', icono: 'auto_stories' },
              { titulo: 'Escalamiento a N2', ruta: '/escalamiento/pendientes', icono: 'trending_up' },
            ],
          },
        ];

      case RolUsuario.ADMINISTRADOR:
        return [
          {
            encabezado: 'Jefatura y Operaciones N2',
            items: [
              { titulo: 'Panel de Control', ruta: '/panel-control', icono: 'dashboard' },
              { 
                titulo: 'Incidentes Críticos (P1/P2)', 
                ruta: '/incidentes/criticos', 
                icono: 'warning',
                badge: '2 P1',
                badgeTipo: 'sla-incumplido'
              },
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
