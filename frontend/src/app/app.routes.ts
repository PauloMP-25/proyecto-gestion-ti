import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guardias/auth.guard';
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
        path: 'panel-control',
        loadChildren: () => import('./funcionalidades/panel-control/panel-control.routes').then(m => m.PANEL_CONTROL_ROUTES),
      },
      {
        path: 'incidentes',
        loadChildren: () => import('./funcionalidades/incidentes/incidentes.routes').then(m => m.INCIDENTES_ROUTES),
      },
      {
        path: 'administracion/matriz-prioridad',
        loadComponent: () => import('./funcionalidades/sla/paginas/sla-configuracion/sla-configuracion.component').then(m => m.SlaConfiguracionComponent),
      },
      {
        path: 'sla/configuracion',
        loadComponent: () => import('./funcionalidades/sla/paginas/sla-configuracion/sla-configuracion.component').then(m => m.SlaConfiguracionComponent),
      },
      {
        path: 'solicitudes',
        loadChildren: () => import('./funcionalidades/solicitudes/solicitudes.routes').then(m => m.SOLICITUDES_ROUTES),
      },
      {
        path: 'incidentes/nuevo',
        redirectTo: 'solicitudes/nuevo',
        pathMatch: 'full',
      },
      {
        path: '403',
        loadComponent: () => import('./funcionalidades/errores/paginas/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent),
        title: 'Acceso denegado - Service Desk HSMSI',
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
