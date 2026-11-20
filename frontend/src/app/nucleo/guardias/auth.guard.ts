import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/']);
  }

  if (
    authService.debeCambiarContrasena() &&
    state.url !== '/cuenta/cambiar-contrasena'
  ) {
    return router.createUrlTree(['/cuenta/cambiar-contrasena']);
  }

  return true;
};