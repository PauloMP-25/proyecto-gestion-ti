export interface PersonaResumenDto {
  readonly id: number;
  readonly nombreVisible: string;
}

export interface AreaResumenDto {
  readonly id: number;
  readonly nombre: string;
  readonly piso: number | null;
  readonly ubicacionLegible: string;
  readonly anexo: string | null;
  readonly encargado: PersonaResumenDto | null;
  readonly activo: boolean;
  readonly totalPersonal: number;
  readonly totalComputadoras: number;
  readonly totalImpresoras: number;
  readonly prioridadDefecto?: string | null;
}

export interface AreaDetalleDto extends AreaResumenDto {
  readonly referenciaUbicacion: string | null;
}

export interface AreaSolicitudDto {
  readonly nombre: string;
  readonly piso: number | null;
  readonly referenciaUbicacion: string | null;
  readonly anexo: string | null;
  readonly idEncargado: number | null;
  readonly prioridadDefecto?: string | null;
}

export interface CambioEstadoAreaDto {
  readonly activo: boolean;
}
