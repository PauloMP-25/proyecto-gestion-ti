import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { TicketsService } from './compartido/servicios/tickets/tickets.service';
import { TicketsHttpService } from './compartido/servicios/tickets/tickets-http.service';
import { jwtInterceptor } from './nucleo/interceptores/jwt.interceptor';
import { errorInterceptor } from './nucleo/interceptores/error.interceptor';
import { CATALOGOS_PROVIDERS } from './compartido/catalogos/catalogos.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    { provide: TicketsService, useClass: TicketsHttpService },
    ...CATALOGOS_PROVIDERS,
  ]
};