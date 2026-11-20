import { Provider } from '@angular/core';
import { CatalogosApi } from './catalogos.api';
import { CatalogosHttp } from './catalogos.http';

export const CATALOGOS_PROVIDERS: Provider[] = [
  {
    provide: CatalogosApi,
    useClass: CatalogosHttp,
  },
];
