import { Routes } from '@angular/router';
import { TURNO_PROVIDERS } from './servicios/turno.providers';

export const MI_TURNO_ROUTES: Routes = [
  {
    path: '',
    providers: TURNO_PROVIDERS,
    children: [],
  },
];
