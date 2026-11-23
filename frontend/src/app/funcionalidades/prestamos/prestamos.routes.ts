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
        title: 'Préstamos de Equipos - Mesa de Ayuda HSMSI',
      },
    ],
  },
];
