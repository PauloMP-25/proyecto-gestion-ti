export type EstadoPrestamo = 'TODOS' | 'VIGENTE' | 'VENCIDO' | 'DEVUELTO';

export type EstadoDevolucion = 'OPERATIVO' | 'CON_DANOS' | 'INCOMPLETO';

export interface PrestamoItem {
  readonly id: number;
  readonly idCi: number;
  readonly codigoInventario: string;
  readonly nombreEquipo: string;
  readonly tipoCi: string;
  readonly marcaModelo?: string | null;
  readonly idAreaDestino: number;
  readonly nombreAreaDestino: string;
  readonly idTicket?: number | null;
  readonly codigoTicket?: string | null;
  readonly solicitante: string;
  readonly tecnicoEntrego?: string | null;
  readonly fechaPrestamo: string;
  readonly fechaDevolucionPactada: string;
  readonly fechaDevolucionReal?: string | null;
  readonly estado: 'VIGENTE' | 'VENCIDO' | 'DEVUELTO';
  readonly estadoDevolucion?: string | null;
  readonly observaciones?: string | null;
}

export interface EntregarPrestamoForm {
  idCi: number;
  idAreaDestino: number;
  solicitante: string;
  fechaDevolucionPactada: string;
  idTicket?: number | null;
  observaciones?: string | null;
}

export interface DevolverPrestamoForm {
  estadoDevolucion: EstadoDevolucion | string;
  observaciones?: string | null;
}

export interface FiltroPrestamos {
  estado?: string;
  areaId?: number;
  buscar?: string;
}

export interface MetricasPrestamo {
  total: number;
  vigentes: number;
  vencidos: number;
  devueltos: number;
}
