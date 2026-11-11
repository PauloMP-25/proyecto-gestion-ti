export interface ErrorValidacion {
  campo: string;
  detalle: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  mensaje: string;
  ruta: string;
  erroresValidacion?: ErrorValidacion[];
}