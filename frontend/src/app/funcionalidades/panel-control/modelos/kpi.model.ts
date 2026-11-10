export type EstadoKpi = 'CUMPLE' | 'EN_RIESGO' | 'INCUMPLE';

export interface DesgloseKpi {
  etiqueta: string;
  valor: string | number;
  color?: string;
  destacado?: boolean;
}

export interface KpiIndicador {
  id: string;
  codigo: string; // KPI-01, KPI-02 ...
  titulo: string;
  subtitulo?: string;
  valor: number | string;
  unidad: '%' | 'min' | 'h' | 'casos' | '';
  meta: string;
  comparador: '≥' | '≤' | '↓';
  estado: EstadoKpi;
  tendenciaTexto?: string;
  tendenciaPositiva?: boolean;
  formula: string;
  alcance?: string;
  descripcion?: string;
  desglose?: DesgloseKpi[];
}

export interface TendenciaServicioClinico {
  servicio: string;
  totalIncidentes: number;
  statIncidentes: number;
  porcentaje: number;
}

export interface DistribucionTipo {
  categoria: string;
  porcentaje: number;
  ejemplo: string;
  casos: number;
  icono: string;
}
