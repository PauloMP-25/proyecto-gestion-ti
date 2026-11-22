import { Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ConocimientoApi } from './conocimiento.api';
import { ConocimientoMock } from './conocimiento.mock';
import { ConocimientoHttp } from './conocimiento.http';

export const CONOCIMIENTO_PROVIDERS: Provider[] = [
  {
    provide: ConocimientoApi,
    useClass: environment.usarMocks ? ConocimientoMock : ConocimientoHttp,
  },
];
