import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { NotificacionService } from '../servicios/notificacion.service';
import { LoggerService } from '../servicios/logger.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificacion = inject(NotificacionService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError(err => {
      logger.error(`Error HTTP en ${req.method} ${req.url}`, err);
      notificacion.mostrarError(err);
      return throwError(() => err);
    })
  );
};