import { Provider } from '@angular/core';
import { TurnoApi } from './turno.api';
import { TurnoHttp } from './turno.http';
import { ConsultaRapidaApi } from './consulta-rapida.api';
import { ConsultaRapidaHttp } from './consulta-rapida.http';

export const TURNO_PROVIDERS: Provider[] = [
  {
    provide: TurnoApi,
    useClass: TurnoHttp,
  },
  {
    provide: ConsultaRapidaApi,
    useClass: ConsultaRapidaHttp,
  },
];
