import { Routes } from '@angular/router';

export const CMDB_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/administracion/equipos',
    pathMatch: 'full',
  },
  {
    path: 'activos',
    redirectTo: '/administracion/equipos',
    pathMatch: 'full',
  },
];
