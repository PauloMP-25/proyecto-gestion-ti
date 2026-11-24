import { Routes } from '@angular/router';
import { PRESTAMOS_PROVIDERS } from './prestamos.providers';

export const PRESTAMOS_ROUTES: Routes = [
  {
    path: '',
    providers: [PRESTAMOS_PROVIDERS],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./paginas/prestamo-lista/prestamo-lista.page').then(
            (m) => m.PrestamoListaPage
          ),
        data: { miga: 'Control de Préstamos' },
        title: 'Préstamos de Equipos - Mesa de Ayuda HSMSI',
      },
    ],
  },
];
