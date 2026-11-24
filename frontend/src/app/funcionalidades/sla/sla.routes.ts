import { Routes } from '@angular/router';
import { rolGuard } from '../../nucleo/guardias/rol.guard';
import { RolUsuario } from '../../nucleo/modelos/rol.enum';

export const SLA_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'metricas',
    pathMatch: 'full',
  },
  {
    path: 'metricas',
    loadComponent: () =>
      import('./paginas/sla-monitor/sla-monitor.component').then(
        (m) => m.SlaMonitorComponent
      ),
    canActivate: [rolGuard],
    data: { roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR], miga: 'Monitor de Compromisos' },
    title: 'Monitor de Compromisos de Atención - Mesa de Ayuda HSMSI',
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./paginas/sla-configuracion/sla-configuracion.component').then(
        (m) => m.SlaConfiguracionComponent
      ),
    canActivate: [rolGuard],
    data: { roles: [RolUsuario.ADMINISTRADOR], miga: 'Configuración de Metas' },
    title: 'Configuraciones - Mesa de Ayuda HSMSI',
  },
];
