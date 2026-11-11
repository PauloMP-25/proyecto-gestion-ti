import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorageService } from '../auth/token-storage.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).obtenerToken();
  if (token && !req.url.includes('/auth/login')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};