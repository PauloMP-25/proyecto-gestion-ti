import { Provider } from '@angular/core';
import { PortalSolicitudesApi } from './portal-solicitudes.api';
import { PortalSolicitudesHttp } from './portal-solicitudes.http';
import { PortalAyudaApi } from './portal-ayuda.api';
import { PortalAyudaHttp } from './portal-ayuda.http';
import { ContextoAtencionApi } from './contexto-atencion.api';
import { ContextoAtencionHttp } from './contexto-atencion.http';

export const PORTAL_PROVIDERS: Provider[] = [
  {
    provide: PortalSolicitudesApi,
    useClass: PortalSolicitudesHttp,
  },
  {
    provide: PortalAyudaApi,
    useClass: PortalAyudaHttp,
  },
  {
    provide: ContextoAtencionApi,
    useClass: ContextoAtencionHttp,
  },
];
