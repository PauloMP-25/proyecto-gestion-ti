import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guardias/auth.guard';
import { rolGuard } from './nucleo/guardias/rol.guard';
import { inicioPorRolGuard } from './nucleo/guardias/inicio-por-rol.guard';
import { RolUsuario } from './nucleo/modelos/rol.enum';
import { MaquetacionPrincipalComponent } from './nucleo/maquetacion/maquetacion-principal/maquetacion-principal.component';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./funcionalidades/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: MaquetacionPrincipalComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [inicioPorRolGuard],
        children: [],
      },
      {
        path: 'portal',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.USUARIO_FINAL], miga: 'Portal Asistencial' },
        loadChildren: () =>
          import('./funcionalidades/portal-asistencial/portal-asistencial.routes').then(
            (m) => m.PORTAL_ASISTENCIAL_ROUTES
          ),
      },
      {
        path: 'mi-turno',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.PRACTICANTE], miga: 'Mi Turno' },
        loadChildren: () =>
          import('./funcionalidades/mi-turno/mi-turno.routes').then(
            (m) => m.MI_TURNO_ROUTES
          ),
      },
      {
        path: 'panel-control',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR], miga: 'Panel de Control' },
        loadChildren: () => import('./funcionalidades/panel-control/panel-control.routes').then(m => m.PANEL_CONTROL_ROUTES),
      },
      {
        path: 'incidentes',
        data: { miga: 'Gestión de Incidentes' },
        loadChildren: () => import('./funcionalidades/incidentes/incidentes.routes').then(m => m.INCIDENTES_ROUTES),
      },
      {
        path: 'sla',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR], miga: 'Compromisos de Atención' },
        loadChildren: () => import('./funcionalidades/sla/sla.routes').then(m => m.SLA_ROUTES),
      },
      {
        path: 'administracion/matriz-prioridad',
        redirectTo: 'sla/configuracion',
        pathMatch: 'full',
      },
      {
        path: 'administracion/sla-config',
        redirectTo: 'sla/configuracion',
        pathMatch: 'full',
      },
      {
        path: 'administracion',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.ADMINISTRADOR], miga: 'Administración' },
        loadChildren: () =>
          import('./funcionalidades/administracion/administracion.routes').then(
            (m) => m.ADMINISTRACION_ROUTES
          ),
      },
      {
        path: 'cmdb',
        redirectTo: 'administracion/equipos',
        pathMatch: 'full',
      },
      {
        path: 'prestamos',
        canActivate: [rolGuard],
        data: { roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR], miga: 'Préstamos de Equipos' },
        loadChildren: () =>
          import('./funcionalidades/prestamos/prestamos.routes').then(
            (m) => m.PRESTAMOS_ROUTES
          ),
      },
      {
        path: 'solicitudes',
        data: { miga: 'Solicitudes' },
        loadChildren: () => import('./funcionalidades/solicitudes/solicitudes.routes').then(m => m.SOLICITUDES_ROUTES),
      },
      {
        path: 'incidentes/nuevo',
        redirectTo: 'solicitudes/nuevo',
        pathMatch: 'full',
      },
      {
        path: 'cuenta/cambiar-contrasena',
        loadComponent: () =>
          import(
            './funcionalidades/auth/paginas/cambiar-contrasena/cambiar-contrasena.page'
          ).then((m) => m.CambiarContrasenaPage),
        title: 'Cambiar contraseña - Mesa de Ayuda HSMSI',
        data: { miga: 'Cambiar contraseña' },
      },
      {
        path: '403',
        loadComponent: () => import('./funcionalidades/errores/paginas/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent),
        title: 'Acceso denegado - Mesa de Ayuda HSMSI',
        data: { miga: 'Acceso denegado' },
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
