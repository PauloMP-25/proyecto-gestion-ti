import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../modelos/rol.enum';

/**
 * Guardia que redirige a /portal/mis-solicitudes si el rol es USUARIO_FINAL.
 * Para personal técnico (PRACTICANTE / ADMINISTRADOR) permite acceder a la vista de incidentes.
 */
export const redireccionMisTicketsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.rolActual() === RolUsuario.USUARIO_FINAL) {
    return router.parseUrl('/portal/mis-solicitudes');
  }

  return true;
};
