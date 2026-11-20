import { GradoProfesional } from '../../../../compartido/catalogos/grado-profesional.enum';

export interface PersonalItem {
  readonly id: number;
  readonly nombre: string;
  readonly apellidos: string;
  readonly nombreCompleto: string;
  readonly nombreVisible: string;
  readonly correo: string;
  readonly nombreUsuario: string | null;
  readonly idArea: number | null;
  readonly nombreArea: string | null;
  readonly rol: string;
  readonly grado: GradoProfesional;
  readonly activo: boolean;
  readonly debeCambiarContrasena: boolean;
  readonly bloqueadoHasta: string | null;
  readonly ultimoAcceso: string | null;
}

export interface PersonalRegistroForm {
  readonly grado: GradoProfesional;
  readonly nombres: string;
  readonly apellidos: string;
  readonly idArea: number;
  readonly correo: string;
  readonly nombreUsuario?: string | null;
  readonly rol: string;
  readonly generarContrasena: boolean;
  readonly contrasena?: string | null;
}

export interface PersonalActualizarForm {
  readonly grado: GradoProfesional;
  readonly nombres: string;
  readonly apellidos: string;
  readonly idArea: number;
  readonly rol: string;
  readonly correo: string;
  readonly nombreUsuario?: string | null;
}

export interface FiltroPersonal {
  readonly busqueda?: string;
  readonly idArea?: number | null;
  readonly grado?: string | null;
  readonly rol?: string | null;
  readonly pagina?: number;
  readonly tamano?: number;
}

export interface ContrasenaTemporalInfo {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly contrasenaTemporal: string;
  readonly mensaje?: string;
}
