import { Routes } from '@angular/router';
import { PORTAL_PROVIDERS } from '../portal-asistencial/servicios/portal.providers';

export const SOLICITUDES_ROUTES: Routes = [
  {
    path: '',
    providers: PORTAL_PROVIDERS,
    children: [
      {
        path: '',
        redirectTo: 'nuevo',
        pathMatch: 'full',
      },
      {
        path: 'nuevo',
        loadComponent: () => 
          import('./paginas/solicitud-crear/solicitud-crear.component').then(m => m.SolicitudCrearComponent),
        title: 'Registrar Incidente o Solicitud - Service Desk HSMSI'
      },
      {
        path: 'crear',
        redirectTo: 'nuevo',
        pathMatch: 'full',
      }
    ]
  }
];
