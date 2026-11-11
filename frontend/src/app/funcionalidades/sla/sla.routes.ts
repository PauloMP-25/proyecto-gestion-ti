import { Routes } from '@angular/router';

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
    title: 'Control de SLAs - Mesa de Ayuda HSMSI',
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./paginas/sla-configuracion/sla-configuracion.component').then(
        (m) => m.SlaConfiguracionComponent
      ),
    title: 'Configuración de SLAs - Mesa de Ayuda HSMSI',
  },
];
