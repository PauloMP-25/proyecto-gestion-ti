import { Routes } from '@angular/router';
import { rolGuard } from '../../nucleo/guardias/rol.guard';
import { RolUsuario } from '../../nucleo/modelos/rol.enum';

const ROLES_SOPORTE = [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR];

export const INCIDENTES_ROUTES: Routes = [
  {
    path: 'criticos',
    loadComponent: () =>
      import('./paginas/incidentes-criticos/incidentes-criticos.component').then(
        (m) => m.IncidentesCriticosComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: ROLES_SOPORTE },
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./paginas/incidente-crear/incidente-crear.component').then(
        (m) => m.IncidenteCrearComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: ROLES_SOPORTE },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./paginas/incidente-detalle/incidente-detalle.component').then(
        (m) => m.IncidenteDetalleComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: ROLES_SOPORTE },
  },
];