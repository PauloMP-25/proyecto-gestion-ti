import { Routes } from '@angular/router';
import { authGuard } from './nucleo/guardias/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./funcionalidades/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'panel-control',
    loadChildren: () => import('./funcionalidades/panel-control/panel-control.routes').then(m => m.PANEL_CONTROL_ROUTES),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/auth/login' }
];
