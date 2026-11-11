import { EstadoTicket } from './estado-ticket.enum';
import { EstadoSLA } from './estado-sla.enum';
import { PrioridadTicket } from './prioridad.enum';
import { NivelSoporte } from './nivel-soporte.enum';
import { Impacto, TipoTicket, Urgencia } from './impacto-urgencia.enum';

export interface Referencia {
  id: number;
  nombre: string;
}

export interface EquipoTicket {
  id: number;
  hostname: string | null;
  ip: string | null;
}

export interface HistorialEntrada {
  fecha: string;
  usuario: string;
  estadoAnterior: EstadoTicket | null;
  estadoNuevo: EstadoTicket;
  comentario: string;
}

export interface Escalamiento {
  fecha: string;
  nivelOrigen: NivelSoporte;
  nivelDestino: NivelSoporte;
  usuarioOrigen: string;
  usuarioDestino: string | null;
  motivo: string;
}

export interface Solucion {
  fecha: string;
  usuario: string;
  descripcion: string;
  esSolucionFinal: boolean;
}

export interface TicketResumen {
  id: number;
  codigo: string;
  tipo: TipoTicket;
  titulo: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  estadoSla: EstadoSLA;
  nivelSoporte: NivelSoporte;
  area: Referencia;
  solicitante: Referencia;
  asignadoA: Referencia | null;
  fechaCreacion: string;
  fechaLimiteResolucion: string | null;
}

export interface Ticket extends TicketResumen {
  descripcion: string;
  categoria: Referencia;
  impacto: Impacto;
  urgencia: Urgencia;
  anexoContacto: string | null;
  equipo: EquipoTicket | null;
  ipOrigen: string | null;
  fechaAsignacion: string | null;
  fechaLimiteRespuesta: string | null;
  fechaRespuestaReal: string | null;
  fechaResolucionReal: string | null;
  fechaCierre: string | null;
  historial: HistorialEntrada[];
  escalamientos: Escalamiento[];
  soluciones: Solucion[];
}