import { EstadoSla } from './estado-sla.enum';

export type FaseSla = 'RESPUESTA' | 'RESOLUCION' | 'COMPLETADO';

export interface SlaTicketVista {
  fase: FaseSla;
  inicioIso: string;               // FechaCreacion
  limiteRespuestaIso: string;      // ya ajustado por pausas (BE-02)
  limiteResolucionIso: string;
  respuestaRealIso: string | null;
  estadoServidor: EstadoSla;       // A_TIEMPO | ALERTA | INCUMPLIDO
  desfaseServidorMs: number;       // se calcula al mapear el DTO
}

export interface SlaCalculado {
  fase: FaseSla;
  restanteMs: number;
  porcentajeRestante: number;      // 0..1
  estado: EstadoSla;
  texto: string;                   // "2 h 15 min" | "45 min" | "09:59" | "Vencido hace 15 min"
}
