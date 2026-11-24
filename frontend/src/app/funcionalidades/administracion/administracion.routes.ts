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
        data: { miga: 'Áreas del Hospital' },
        title: 'Áreas del hospital - Mesa de Ayuda HSMSI',
      },
      {
        path: 'areas/:id',
        loadComponent: () =>
          import('./areas/paginas/area-detalle/area-detalle.page').then(
            (m) => m.AreaDetallePage
          ),
        data: { miga: 'Detalle de Área' },
        title: 'Detalle de área - Mesa de Ayuda HSMSI',
      },
      {
        path: 'personal',
        loadComponent: () =>
          import('./personal/paginas/personal-lista/personal-lista.page').then(
            (m) => m.PersonalListaPage
          ),
        data: { miga: 'Personal y Cuentas' },
        title: 'Personal y cuentas - Mesa de Ayuda HSMSI',
      },
      {
        path: 'equipos',
        loadComponent: () =>
          import('./equipos/paginas/equipos-lista/equipos-lista.page').then(
            (m) => m.EquiposListaPage
          ),
        data: { miga: 'Inventario de Equipos y Red' },
        title: 'Inventario de equipos y red - Mesa de Ayuda HSMSI',
      },
      {
        path: 'conocimiento',
        loadComponent: () =>
          import(
            './conocimiento/paginas/conocimiento-lista/conocimiento-lista.page'
          ).then((m) => m.ConocimientoListaPage),
        data: { miga: 'Centro de Soluciones y Guías' },
        title: 'Centro de Soluciones y Guías - Mesa de Ayuda HSMSI',
      },
      {
        path: 'cambios',
        loadComponent: () =>
          import(
            './cambios/paginas/cambios-lista/cambios-lista.page'
          ).then((m) => m.CambiosListaPage),
        data: { miga: 'Solicitudes de Cambio' },
        title: 'Solicitudes de Cambio - Mesa de Ayuda HSMSI',
      },
      { path: '', pathMatch: 'full', redirectTo: 'areas' },
    ],
  },
];
