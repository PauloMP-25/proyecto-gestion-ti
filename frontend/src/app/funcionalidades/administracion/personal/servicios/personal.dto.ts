export interface UsuarioRespuestaDto {
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
  readonly grado: string;
  readonly activo: boolean;
  readonly debeCambiarContrasena: boolean;
  readonly bloqueadoHasta: string | null;
  readonly ultimoAcceso: string | null;
  readonly contrasenaTemporal?: string | null;
}

export interface UsuarioRegistroRequestDto {
  readonly nombre: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly nombreUsuario?: string | null;
  readonly idArea: number;
  readonly rol: string;
  readonly grado: string;
  readonly contrasena?: string | null;
  readonly generarContrasena: boolean;
}

export interface UsuarioActualizarRequestDto {
  readonly nombre: string;
  readonly apellidos: string;
  readonly correo: string;
  readonly nombreUsuario?: string | null;
  readonly idArea: number;
  readonly rol: string;
  readonly grado: string;
}

export interface RestablecerContrasenaRespuestaDto {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly correo: string;
  readonly contrasenaTemporal: string;
  readonly mensaje?: string;
}

export interface PaginaRespuestaPersonalDto<T> {
  readonly contenido: T[];
  readonly pagina: number;
  readonly tamano: number;
  readonly totalElementos: number;
  readonly totalPaginas: number;
}
