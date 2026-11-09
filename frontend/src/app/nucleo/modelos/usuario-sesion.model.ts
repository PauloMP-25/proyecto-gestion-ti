import { RolUsuario } from './rol.enum';

export interface UsuarioSesion {
  id: string;
  nombreCompleto: string;
  correo: string;
  rol: RolUsuario;
  areaProcedencia?: string; // Ej: 'Triaje de Emergencia', 'Admisión Central', etc.
  cargo?: string;
  avatarUrl?: string;
}
