import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PrestamosStore } from './estado/prestamos.store';
import { PrestamosApi } from './servicios/prestamos.api';
import { PrestamosHttpService } from './servicios/prestamos.http';
import { PrestamosMockService } from './servicios/prestamos.mock';

export const PRESTAMOS_PROVIDERS: Provider[] = [
  {
    provide: PrestamosApi,
    useClass: environment.usarMocks ? PrestamosMockService : PrestamosHttpService,
  },
  PrestamosStore,
];
