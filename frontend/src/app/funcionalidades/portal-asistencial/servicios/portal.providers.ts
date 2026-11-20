import { Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { PortalSolicitudesApi } from './portal-solicitudes.api';
import { PortalSolicitudesMock } from './portal-solicitudes.mock';
import { PortalSolicitudesHttp } from './portal-solicitudes.http';
import { PortalAyudaApi } from './portal-ayuda.api';
import { PortalAyudaMock } from './portal-ayuda.mock';
import { PortalAyudaHttp } from './portal-ayuda.http';

import { ContextoAtencionApi } from './contexto-atencion.api';
import { ContextoAtencionMock } from './contexto-atencion.mock';
import { ContextoAtencionHttp } from './contexto-atencion.http';

export const PORTAL_PROVIDERS: Provider[] = [
  {
    provide: PortalSolicitudesApi,
    useClass: environment.usarMocks ? PortalSolicitudesMock : PortalSolicitudesHttp,
  },
  {
    provide: PortalAyudaApi,
    useClass: environment.usarMocks ? PortalAyudaMock : PortalAyudaHttp,
  },
  {
    provide: ContextoAtencionApi,
    useClass: environment.usarMocks ? ContextoAtencionMock : ContextoAtencionHttp,
  },
];
