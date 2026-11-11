import { Routes } from '@angular/router';

export const CMDB_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'activos',
    pathMatch: 'full',
  },
  {
    path: 'activos',
    loadComponent: () =>
      import('./paginas/cmdb-lista/cmdb-lista.component').then(
        (m) => m.CmdbListaComponent
      ),
    title: 'Activos y Red (CMDB) - Mesa de Ayuda HSMSI',
  },
];
