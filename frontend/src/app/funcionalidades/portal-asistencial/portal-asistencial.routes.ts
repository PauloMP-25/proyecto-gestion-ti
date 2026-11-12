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
      {
        path: 'mis-solicitudes/:id',
        title: 'Mesa de Ayuda · Detalle de solicitud',
        loadComponent: () =>
          import('./paginas/solicitud-detalle/solicitud-detalle.page').then(
            (m) => m.SolicitudDetallePage
          ),
      },
      {
        path: 'ayuda',
        title: 'Mesa de Ayuda · Ayuda rápida',
        loadComponent: () =>
          import('./paginas/ayuda-rapida/ayuda-rapida.page').then(
            (m) => m.AyudaRapidaPage
          ),
      },
      {
        path: 'ayuda/:articuloId',
        title: 'Mesa de Ayuda · Guía de autoatención',
        loadComponent: () =>
          import('./paginas/ayuda-articulo/ayuda-articulo.page').then(
            (m) => m.AyudaArticuloPage
          ),
      },
    ],
  },
];
