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
        data: { miga: 'Registrar Solicitud' },
        title: 'Registrar Solicitud - Mesa de Ayuda HSMSI'
      },
      {
        path: 'crear',
        redirectTo: 'nuevo',
        pathMatch: 'full',
      }
    ]
  }
];
