import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CatalogosApi } from './catalogos.api';
import { CatalogosHttp } from './catalogos.http';
import { CatalogosMock } from './catalogos.mock';

export const CATALOGOS_PROVIDERS: Provider[] = [
  {
    provide: CatalogosApi,
    useClass: environment.usarMocks ? CatalogosMock : CatalogosHttp,
  },
];
