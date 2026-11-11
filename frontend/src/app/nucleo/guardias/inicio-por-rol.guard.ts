import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { rutaInicioPorRol } from '../auth/ruta-inicio';

export const inicioPorRolGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rol = authService.rolActual();
  const rutaDestino = rutaInicioPorRol(rol);
  return router.parseUrl(rutaDestino);
};
