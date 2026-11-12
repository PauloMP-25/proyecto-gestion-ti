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
      {
        path: 'ticket/:id',
        title: 'Mesa de Ayuda · Ficha de Atención',
        loadComponent: () =>
          import('./paginas/ficha-atencion/ficha-atencion.page').then(
            (m) => m.FichaAtencionPage
          ),
      },
      {
        path: 'consulta',
        title: 'Mesa de Ayuda · Consulta Rápida',
        loadComponent: () =>
          import('./paginas/consulta-rapida/consulta-rapida.page').then(
            (m) => m.ConsultaRapidaPage
          ),
      },
      {
        path: 'consulta/articulo/:id',
        title: 'Mesa de Ayuda · Guía Técnica de Solución',
        loadComponent: () =>
          import('./paginas/consulta-articulo/consulta-articulo.page').then(
            (m) => m.ConsultaArticuloPage
          ),
      },
    ],
  },
];
