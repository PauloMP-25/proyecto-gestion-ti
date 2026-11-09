import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../modelos/rol.enum';

export const rolGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos = route.data['roles'] as RolUsuario[] | undefined;
  const rolActual = authService.rolActual();

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  if (rolActual && rolesPermitidos.includes(rolActual)) {
    return true;
  }

  // Si no tiene permiso para la ruta
  if (rolActual === RolUsuario.USUARIO_FINAL) {
    router.navigate(['/inicio']);
  } else {
    router.navigate(['/panel-control']);
  }

  return false;
};

