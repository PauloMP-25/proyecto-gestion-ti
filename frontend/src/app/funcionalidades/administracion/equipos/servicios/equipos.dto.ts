export interface EquipoResumenDto {
  readonly id: number;
  readonly codigoInventario: string;
  readonly tipo: string;
  readonly idArea: number;
  readonly nombreArea: string;
  readonly marcaModelo: string | null;
  readonly referenciaUbicacion: string | null;
  readonly ipVigente: string | null;
  readonly estado: string;
  readonly activo: boolean;
}

export interface EquipoDetalleDto extends EquipoResumenDto {
  readonly hostname: string | null;
}

export interface EquipoSolicitudDto {
  readonly tipo: string;
  readonly idArea: number;
  readonly codigoInventario: string;
  readonly marcaModelo?: string | null;
  readonly referenciaUbicacion?: string | null;
  readonly ipEstatica?: string | null;
  readonly hostname?: string | null;
}

export interface CodigoSugeridoRespuestaDto {
  readonly codigoSugerido: string;
  readonly abrevArea: string;
  readonly secuencia: number;
}

export interface DisponibilidadIpRespuestaDto {
  readonly disponible: boolean;
  readonly mensaje: string;
  readonly equipoEnUso?: string | null;
  readonly idEquipoEnUso?: number | null;
}

export interface PaginaRespuestaEquiposDto<T> {
  readonly contenido: T[];
  readonly pagina: number;
  readonly tamano: number;
  readonly totalElementos: number;
  readonly totalPaginas: number;
}
