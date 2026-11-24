import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../servicios/notificacion.service';
import { LoggerService } from '../servicios/logger.service';
import { TokenStorageService } from '../auth/token-storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacion = inject(NotificacionService);
  const logger = inject(LoggerService);
  const router = inject(Router);
  const tokenStorage = inject(TokenStorageService);

  return next(req).pipe(
    catchError(err => {
      logger.error(`Error HTTP en ${req.method} ${req.url}`, err);

      if (err.status === 401 && !req.url.includes('/auth/login')) {
        tokenStorage.limpiar();
        notificacion.error('Tu sesión ha expirado por inactividad. Por favor, ingresa nuevamente.');
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      notificacion.mostrarError(err);
      return throwError(() => err);
    })
  );
};