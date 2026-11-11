import { RolUsuario } from '../modelos/rol.enum';

/**
 * Devuelve la ruta inicial predeterminada según el rol asignado al usuario.
 * - USUARIO_FINAL: Portal asistencial (/portal)
 * - PRACTICANTE: Gestión de turno (/mi-turno)
 * - ADMINISTRADOR: Panel de control ejecutivo (/panel-control)
 */
export function rutaInicioPorRol(rol: RolUsuario | null): string {
  switch (rol) {
    case RolUsuario.USUARIO_FINAL:
      return '/portal';
    case RolUsuario.PRACTICANTE:
      return '/mi-turno';
    case RolUsuario.ADMINISTRADOR:
      return '/panel-control';
    default:
      return '/auth/login';
  }
}
