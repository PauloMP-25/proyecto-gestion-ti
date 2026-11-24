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
    data: { roles: ROLES_SOPORTE, miga: 'Bandeja de Tickets' },
    title: 'Bandeja de Tickets - Mesa de Ayuda HSMSI',
  },
  {
    path: 'mis-tickets',
    loadComponent: () =>
      import('./paginas/incidente-lista/incidente-lista.component').then(
        (m) => m.IncidenteListaComponent,
      ),
    canActivate: [redireccionMisTicketsGuard],
    data: { modo: 'propios', miga: 'Mis Tickets' },
    title: 'Mis Tickets - Mesa de Ayuda HSMSI',
  },
  {
    path: 'escalados',
    loadComponent: () =>
      import('./paginas/incidente-lista/incidente-lista.component').then(
        (m) => m.IncidenteListaComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR], modo: 'escalados', miga: 'Tickets Derivados (N2)' },
    title: 'Tickets Derivados a Soporte Nivel 2 - Mesa de Ayuda HSMSI',
  },
  {
    path: 'criticos',
    loadComponent: () =>
      import('./paginas/incidentes-criticos/incidentes-criticos.component').then(
        (m) => m.IncidentesCriticosComponent,
      ),
    canActivate: [rolGuard],
    data: { roles: ROLES_SOPORTE, miga: 'Incidentes Críticos' },
    title: 'Incidentes Críticos - Mesa de Ayuda HSMSI',
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
    data: { miga: 'Detalle de Ticket' },
    title: 'Detalle de Ticket - Mesa de Ayuda HSMSI',
  },
];