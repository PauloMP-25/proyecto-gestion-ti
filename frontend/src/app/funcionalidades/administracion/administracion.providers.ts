import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CambiosApi } from './cambios/servicios/cambios.api';
import { CambiosHttp } from './cambios/servicios/cambios.http';
import { CambiosMock } from './cambios/servicios/cambios.mock';
import { AreasApi } from './areas/servicios/areas.api';
import { AreasHttp } from './areas/servicios/areas.http';
import { AreasStore } from './areas/estado/areas.store';
import { PersonalApi } from './personal/servicios/personal.api';
import { PersonalHttp } from './personal/servicios/personal.http';
import { PersonalStore } from './personal/estado/personal.store';
import { EquiposApi } from './equipos/servicios/equipos.api';
import { EquiposHttp } from './equipos/servicios/equipos.http';
import { EquiposStore } from './equipos/estado/equipos.store';

export const ADMINISTRACION_PROVIDERS: Provider[] = [
  {
    provide: AreasApi,
    useClass: AreasHttp,
  },
  AreasStore,
  {
    provide: PersonalApi,
    useClass: PersonalHttp,
  },
  PersonalStore,
  {
    provide: EquiposApi,
    useClass: EquiposHttp,
  },
  EquiposStore,
  {
    provide: CambiosApi,
    useClass: environment.usarMocks ? CambiosMock : CambiosHttp,
  },
];
