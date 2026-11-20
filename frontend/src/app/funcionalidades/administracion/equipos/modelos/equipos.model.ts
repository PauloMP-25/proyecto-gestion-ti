export interface EquipoItem {
  readonly id: number;
  readonly codigoInventario: string;
  readonly tipo: 'COMPUTADORA' | 'IMPRESORA' | string;
  readonly idArea: number;
  readonly nombreArea: string;
  readonly marcaModelo: string | null;
  readonly referenciaUbicacion: string | null;
  readonly ipVigente: string | null;
  readonly estado: string;
  readonly activo: boolean;
  readonly hostname: string | null;
  readonly mac: string | null;
}

export interface EquipoFormulario {
  readonly tipo: string;
  readonly idArea: number;
  readonly codigoInventario: string;
  readonly marcaModelo?: string | null;
  readonly referenciaUbicacion?: string | null;
  readonly ipEstatica?: string | null;
  readonly hostname?: string | null;
  readonly mac?: string | null;
}

export interface FiltroEquipos {
  readonly idArea?: number | null;
  readonly tipo?: string | null;
  readonly estado?: string | null;
  readonly sinIp?: boolean | null;
  readonly buscar?: string | null;
  readonly pagina?: number;
  readonly tamano?: number;
}

export interface DisponibilidadIp {
  readonly disponible: boolean;
  readonly mensaje: string;
  readonly equipoEnUso?: string | null;
  readonly idEquipoEnUso?: number | null;
}
