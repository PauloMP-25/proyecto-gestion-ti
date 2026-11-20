import { RolUsuario } from '../../modelos/rol.enum';
import { SeccionMenu } from './menu.model';

export const MENU_POR_ROL: Record<RolUsuario, readonly SeccionMenu[]> = {
  [RolUsuario.USUARIO_FINAL]: [
    {
      encabezado: 'Atención Asistencial',
      items: [
        { titulo: 'Inicio', ruta: '/portal', icono: 'home', exacto: true },
        { titulo: 'Reportar un problema', ruta: '/solicitudes/nuevo', icono: 'add_circle' },
        { titulo: 'Mis solicitudes', ruta: '/portal/mis-solicitudes', icono: 'receipt_long' },
        { titulo: 'Ayuda rápida', ruta: '/portal/ayuda', icono: 'live_help' },
      ],
    },
  ],

  [RolUsuario.PRACTICANTE]: [
    {
      encabezado: 'Mesa de Ayuda (Mi Turno)',
      items: [
        { titulo: 'Mi turno', ruta: '/mi-turno', icono: 'schedule', exacto: true },
        { titulo: 'Consultar equipos y soluciones', ruta: '/mi-turno/consulta', icono: 'search' },
        { titulo: 'Registrar para un tercero', ruta: '/solicitudes/nuevo', icono: 'add_circle' },
        { titulo: 'Bandeja general', ruta: '/incidentes/bandeja', icono: 'inbox' },
        {
          titulo: 'Incidentes críticos',
          ruta: '/incidentes/criticos',
          icono: 'warning',
        },
        { titulo: 'Monitor de compromisos', ruta: '/sla/metricas', icono: 'timer' },
        { titulo: 'Panel de control', ruta: '/panel-control', icono: 'dashboard', exacto: true },
      ],
    },
  ],

  [RolUsuario.ADMINISTRADOR]: [
    {
      encabezado: 'Jefatura y Operaciones N2',
      items: [
        { titulo: 'Panel de Control', ruta: '/panel-control', icono: 'dashboard', exacto: true },
        { titulo: 'Bandeja de Tickets', ruta: '/incidentes/bandeja', icono: 'inbox' },
        {
          titulo: 'Incidentes Críticos',
          ruta: '/incidentes/criticos',
          icono: 'warning',
          badge: 'P1',
          badgeTipo: 'peligro',
        },
        { titulo: 'Nivel de Prioridad de Soporte', ruta: '/administracion/matriz-prioridad', icono: 'grid_on' },
      ],
    },
    {
      encabezado: 'Administración Hospitalaria',
      items: [
        { titulo: 'Áreas del hospital', ruta: '/administracion/areas', icono: 'apartment' },
        { titulo: 'Personal y cuentas', ruta: '/administracion/personal', icono: 'group' },
        { titulo: 'Inventario de equipos y red', ruta: '/administracion/equipos', icono: 'devices' },
      ],
    },
    {
      encabezado: 'Gestión Institucional',
      items: [
        { titulo: 'Solicitudes de cambio', ruta: '/administracion/cambios', icono: 'change_circle' },
        { titulo: 'Centro de soluciones y guías', ruta: '/administracion/conocimiento', icono: 'menu_book' },
        { titulo: 'Compromisos de atención (SLA)', ruta: '/administracion/sla-config', icono: 'tune' },
      ],
    },
  ],
};
