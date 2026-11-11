import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../nucleo/config/api-endpoints';
import { Area, Categoria, ContextoCliente, CrearTicketDto, Tecnico } from '../../modelos/ticket.dto';
import { Ticket, TicketResumen } from '../../modelos/ticket.model';
import { TicketFiltros, Paginacion } from '../../modelos/ticket-filtros.model';
import { Pagina } from '../../modelos/pagina.model';
import { TicketMapper } from '../../modelos/ticket.mapper';
import { AccionEstado, TicketsService } from './tickets.service';

@Injectable()
export class TicketsHttpService extends TicketsService {
  private http = inject(HttpClient);
  private mapper = inject(TicketMapper);

  contextoCliente(): Observable<ContextoCliente> {
    return this.http.get<ContextoCliente>(API_ENDPOINTS.contextoCliente);
  }

  crear(dto: CrearTicketDto): Observable<Ticket> {
    return this.http.post(API_ENDPOINTS.tickets, dto).pipe(map(r => this.mapper.detalle(r)));
  }

  listar(f: TicketFiltros, p: Paginacion): Observable<Pagina<TicketResumen>> {
    let params = new HttpParams()
      .set('pagina', p.pagina)
      .set('tamano', p.tamano)
      .set('orden', 'fechaCreacion,desc');
    if (f.estado) params = params.set('estado', f.estado);
    if (f.prioridad) params = params.set('prioridad', f.prioridad);
    if (f.idArea !== '' && f.idArea != null) params = params.set('idArea', f.idArea);
    if (f.texto?.trim()) params = params.set('texto', f.texto.trim());
    return this.http.get(API_ENDPOINTS.tickets, { params }).pipe(
      map(r => this.mapper.pagina(r, item => this.mapper.resumen(item)))
    );
  }

  misTickets(p: Paginacion): Observable<Pagina<TicketResumen>> {
    const params = new HttpParams().set('pagina', p.pagina).set('tamano', p.tamano).set('orden', 'fechaCreacion,desc');
    return this.http.get(API_ENDPOINTS.misTickets, { params }).pipe(
      map(r => this.mapper.pagina(r, item => this.mapper.resumen(item)))
    );
  }

  obtener(id: number): Observable<Ticket> {
    return this.http.get(`${API_ENDPOINTS.tickets}/${id}`).pipe(map(r => this.mapper.detalle(r)));
  }

  tecnicos(): Observable<Tecnico[]> {
    return this.http.get<Tecnico[]>(API_ENDPOINTS.tecnicos);
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(API_ENDPOINTS.categorias);
  }

  areas(): Observable<Area[]> {
    return this.http.get<Area[]>(API_ENDPOINTS.areas);
  }

  asignar(id: number, idTecnico: number, comentario?: string): Observable<Ticket> {
    return this.accion(id, 'asignar', { idTecnico, comentario });
  }

  tomar(id: number): Observable<Ticket> {
    return this.accion(id, 'tomar', {});
  }

  cambiarEstado(id: number, accion: AccionEstado, texto?: string): Observable<Ticket> {
    const cuerpo = accion === 'reabrir' ? { motivo: texto } : { comentario: texto };
    return this.accion(id, accion, cuerpo);
  }

  escalar(id: number, motivo: string): Observable<Ticket> {
    return this.accion(id, 'escalar', { motivo });
  }

  resolver(id: number, solucion: string): Observable<Ticket> {
    return this.accion(id, 'resolver', { solucion });
  }

  private accion(id: number, accion: string, cuerpo: object): Observable<Ticket> {
    return this.http.put(`${API_ENDPOINTS.tickets}/${id}/${accion}`, cuerpo).pipe(map(r => this.mapper.detalle(r)));
  }
}