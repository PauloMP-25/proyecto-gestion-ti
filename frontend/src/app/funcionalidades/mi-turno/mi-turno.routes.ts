import { Routes } from '@angular/router';
import { TURNO_PROVIDERS } from './servicios/turno.providers';

export const MI_TURNO_ROUTES: Routes = [
  {
    path: '',
    providers: TURNO_PROVIDERS,
    children: [
      {
        path: '',
        title: 'Mesa de Ayuda · Mi Turno',
        loadComponent: () =>
          import('./paginas/bandeja-turno/bandeja-turno.page').then(
            (m) => m.BandejaTurnoPage
          ),
      },
    ],
  },
];
