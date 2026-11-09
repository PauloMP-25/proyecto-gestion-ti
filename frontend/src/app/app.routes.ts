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
        path: 'administracion/matriz-prioridad',
        loadComponent: () => import('./funcionalidades/sla/paginas/sla-configuracion/sla-configuracion.component').then(m => m.SlaConfiguracionComponent),
      },
      {
        path: 'sla/configuracion',
        loadComponent: () => import('./funcionalidades/sla/paginas/sla-configuracion/sla-configuracion.component').then(m => m.SlaConfiguracionComponent),
      },
      // Rutas protegidas dentro del Shell:
      // solicitudes, incidentes, cmdb, administracion, etc.
    ]
  },
  { path: '**', redirectTo: '' }
];
