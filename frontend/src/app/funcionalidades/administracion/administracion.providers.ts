import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AreasApi } from './areas/servicios/areas.api';
import { AreasHttp } from './areas/servicios/areas.http';
import { AreasMock } from './areas/servicios/areas.mock';
import { AreasStore } from './areas/estado/areas.store';
import { PersonalApi } from './personal/servicios/personal.api';
import { PersonalHttp } from './personal/servicios/personal.http';
import { PersonalMock } from './personal/servicios/personal.mock';
import { PersonalStore } from './personal/estado/personal.store';
import { EquiposApi } from './equipos/servicios/equipos.api';
import { EquiposHttp } from './equipos/servicios/equipos.http';
import { EquiposMock } from './equipos/servicios/equipos.mock';
import { EquiposStore } from './equipos/estado/equipos.store';

export const ADMINISTRACION_PROVIDERS: Provider[] = [
  {
    provide: AreasApi,
    useClass: environment.usarMocks ? AreasMock : AreasHttp,
  },
  AreasStore,
  {
    provide: PersonalApi,
    useClass: environment.usarMocks ? PersonalMock : PersonalHttp,
  },
  PersonalStore,
  {
    provide: EquiposApi,
    useClass: environment.usarMocks ? EquiposMock : EquiposHttp,
  },
  EquiposStore,
];
