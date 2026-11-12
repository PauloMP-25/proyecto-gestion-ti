import { Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { TurnoApi } from './turno.api';
import { TurnoMock } from './turno.mock';
import { TurnoHttp } from './turno.http';
import { ConsultaRapidaApi } from './consulta-rapida.api';
import { ConsultaRapidaMock } from './consulta-rapida.mock';
import { ConsultaRapidaHttp } from './consulta-rapida.http';

export const TURNO_PROVIDERS: Provider[] = [
  {
    provide: TurnoApi,
    useClass: environment.usarMocks ? TurnoMock : TurnoHttp,
  },
  {
    provide: ConsultaRapidaApi,
    useClass: environment.usarMocks ? ConsultaRapidaMock : ConsultaRapidaHttp,
  },
];
