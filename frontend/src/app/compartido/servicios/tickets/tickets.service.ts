import { Observable } from 'rxjs';
import { Area, Categoria, ContextoCliente, CrearTicketDto, Tecnico } from '../../modelos/ticket.dto';
import { Ticket, TicketResumen } from '../../modelos/ticket.model';
import { TicketFiltros, Paginacion } from '../../modelos/ticket-filtros.model';
import { Pagina } from '../../modelos/pagina.model';

export type AccionEstado = 'iniciar' | 'cerrar' | 'reabrir';

export abstract class TicketsService {
  abstract contextoCliente(): Observable<ContextoCliente>;
  abstract crear(dto: CrearTicketDto): Observable<Ticket>;
  abstract listar(f: TicketFiltros, p: Paginacion): Observable<Pagina<TicketResumen>>;
  abstract misTickets(p: Paginacion): Observable<Pagina<TicketResumen>>;
  abstract obtener(id: number): Observable<Ticket>;
  abstract tecnicos(): Observable<Tecnico[]>;
  abstract categorias(): Observable<Categoria[]>;
  abstract areas(): Observable<Area[]>;
  abstract asignar(id: number, idTecnico: number, comentario?: string): Observable<Ticket>;
  abstract tomar(id: number): Observable<Ticket>;
  abstract cambiarEstado(id: number, accion: AccionEstado, texto?: string): Observable<Ticket>;
  abstract escalar(id: number, motivo: string): Observable<Ticket>;
  abstract resolver(id: number, solucion: string): Observable<Ticket>;
}