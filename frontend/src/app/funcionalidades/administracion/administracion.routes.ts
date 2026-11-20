import { Routes } from '@angular/router';
import { ADMINISTRACION_PROVIDERS } from './administracion.providers';

export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    providers: ADMINISTRACION_PROVIDERS,
    children: [
      {
        path: 'areas',
        loadComponent: () =>
          import('./areas/paginas/areas-lista/areas-lista.page').then(
            (m) => m.AreasListaPage
          ),
        title: 'Áreas del hospital - Mesa de Ayuda HSMSI',
      },
      {
        path: 'areas/:id',
        loadComponent: () =>
          import('./areas/paginas/area-detalle/area-detalle.page').then(
            (m) => m.AreaDetallePage
          ),
        title: 'Detalle de área - Mesa de Ayuda HSMSI',
      },
      { path: '', pathMatch: 'full', redirectTo: 'areas' },
    ],
  },
];
