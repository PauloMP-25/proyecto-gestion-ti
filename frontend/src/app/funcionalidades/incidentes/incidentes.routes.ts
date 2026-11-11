import { Routes } from '@angular/router';
import { rolGuard } from '../../nucleo/guardias/rol.guard';
import { redireccionMisTicketsGuard } from '../../nucleo/guardias/redireccion-mis-tickets.guard';
import { RolUsuario } from '../../nucleo/modelos/rol.enum';

const ROLES_SOPORTE = [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR];

export const INCIDENTES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bandeja',
    pathMatch: 'full',
  },
  {
    path: 'bandeja',
    loadComponent: () =>
      import('./paginas/incidente-lista/incidente-lista.component').then(
        (m) => m.IncidenteListaComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: ROLES_SOPORTE },
    title: 'Bandeja de Tickets - Service Desk HSMSI',
  },
  {
    path: 'mis-tickets',
    loadComponent: () =>
      import('./paginas/incidente-lista/incidente-lista.component').then(
        (m) => m.IncidenteListaComponent,
      ),
    canActivate: [redireccionMisTicketsGuard],
    data: { modo: 'propios' },
    title: 'Mis Tickets - Service Desk HSMSI',
  },
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
    redirectTo: '/solicitudes/nuevo',
    pathMatch: 'full',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./paginas/incidente-detalle/incidente-detalle.component').then(
        (m) => m.IncidenteDetalleComponent,
      ),
    title: 'Detalle de Ticket - Service Desk HSMSI',
  },
];