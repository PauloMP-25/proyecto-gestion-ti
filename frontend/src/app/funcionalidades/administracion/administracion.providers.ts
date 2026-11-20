import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AreasApi } from './areas/servicios/areas.api';
import { AreasHttp } from './areas/servicios/areas.http';
import { AreasMock } from './areas/servicios/areas.mock';
import { AreasStore } from './areas/estado/areas.store';

export const ADMINISTRACION_PROVIDERS: Provider[] = [
  {
    provide: AreasApi,
    useClass: environment.usarMocks ? AreasMock : AreasHttp,
  },
  AreasStore,
];
