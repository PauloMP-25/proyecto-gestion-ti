import { PrioridadTicket } from './prioridad.enum';
import { EstadoTicket } from './estado-ticket.enum';
import { SlaInfo } from './sla-info.model';

export type NivelSoporte = 'N1' | 'N2';
export type TipoTicket = 'INCIDENTE' | 'SOLICITUD';

export interface ActivoTicket {
  nombre: string;
  ip?: string;
  tipo?: string;
}

export interface ResponsableTicket {
  id: string;
  nombre: string;
  cargo?: string;
}

export interface TicketResumen {
  id: string;
  codigo: string; // ej: TK-1082
  tipo: TipoTicket;
  titulo: string;
  areaClinica: string;
  activoAfectado?: ActivoTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  nivelActual: NivelSoporte;
  responsable?: ResponsableTicket;
  slaRespuesta?: SlaInfo;
  slaResolucion: SlaInfo;
  fechaCreacion: string;
  esCriticoStat?: boolean;
}
