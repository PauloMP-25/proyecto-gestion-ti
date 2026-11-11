import { EstadoTicket } from './estado-ticket.enum';
import { PrioridadTicket } from './prioridad.enum';

export interface TicketFiltros {
  estado?: EstadoTicket | '';
  prioridad?: PrioridadTicket | '';
  idArea?: number | '';
  texto?: string;
}

export interface Paginacion {
  pagina: number;
  tamano: number;
}