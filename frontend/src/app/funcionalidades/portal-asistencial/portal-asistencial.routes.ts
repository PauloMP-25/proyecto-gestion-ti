import { Routes } from '@angular/router';
import { PORTAL_PROVIDERS } from './servicios/portal.providers';

export const PORTAL_ASISTENCIAL_ROUTES: Routes = [
  {
    path: '',
    providers: PORTAL_PROVIDERS,
    children: [
      {
        path: '',
        title: 'Mesa de Ayuda · Portal Asistencial',
        loadComponent: () =>
          import('./paginas/portal-inicio/portal-inicio.page').then(
            (m) => m.PortalInicioPage
          ),
      },
      {
        path: 'mis-solicitudes',
        title: 'Mesa de Ayuda · Mis solicitudes',
        loadComponent: () =>
          import('./paginas/mis-solicitudes/mis-solicitudes.page').then(
            (m) => m.MisSolicitudesPage
          ),
      },
    ],
  },
];
