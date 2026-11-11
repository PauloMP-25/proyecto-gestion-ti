import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AuthService } from '../../../nucleo/auth/auth.service';
import { Area, Categoria, ContextoCliente, CrearTicketDto, Tecnico } from '../../modelos/ticket.dto';
import { Ticket, TicketResumen } from '../../modelos/ticket.model';
import { TicketFiltros, Paginacion } from '../../modelos/ticket-filtros.model';
import { Pagina } from '../../modelos/pagina.model';
import { EstadoTicket } from '../../modelos/estado-ticket.enum';
import { EstadoSLA } from '../../modelos/estado-sla.enum';
import { NivelSoporte } from '../../modelos/nivel-soporte.enum';
import { AccionEstado, TicketsService } from './tickets.service';
import {
  AREAS_MOCK,
  CATEGORIAS_MOCK,
  CONTEXTO_MOCK,
  TECNICOS_MOCK,
  TICKETS_MOCK,
  TIEMPOS_SLA_MIN,
  isoLima,
  prioridadDe,
  resumenDe,
} from './datos-mock/tickets.mock';

const RETARDO_MS = 300;

function errorMock(status: number, mensaje: string): Observable<never> {
  return throwError(() => ({ status, error: { status, mensaje } }));
}

@Injectable()
export class TicketsMockService extends TicketsService {
  private authService = inject(AuthService);
  private tickets: Ticket[] = structuredClone(TICKETS_MOCK);

  contextoCliente(): Observable<ContextoCliente> {
    return of(CONTEXTO_MOCK).pipe(delay(RETARDO_MS));
  }

  crear(dto: CrearTicketDto): Observable<Ticket> {
    const usuario = this.authService.usuarioActual();
    const contexto = CONTEXTO_MOCK;
    const id = Math.max(...this.tickets.map(t => t.id)) + 1;
    const ahoraMs = Date.now();
    const prioridad = prioridadDe(dto.impacto, dto.urgencia);
    const tiempos = TIEMPOS_SLA_MIN[prioridad];
    const categoria = CATEGORIAS_MOCK.find(c => c.id === dto.idCategoria) ?? CATEGORIAS_MOCK[0];

    const ticket: Ticket = {
      id,
      codigo: `${dto.tipo === 'SOLICITUD' ? 'SOL' : 'INC'}-2026-${String(id).padStart(5, '0')}`,
      tipo: dto.tipo,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      categoria,
      impacto: dto.impacto,
      urgencia: dto.urgencia,
      prioridad,
      estado: EstadoTicket.NUEVO,
      estadoSla: EstadoSLA.A_TIEMPO,
      nivelSoporte: NivelSoporte.N1,
      area: { id: contexto.idArea ?? 0, nombre: contexto.area ?? 'Sin área' },
      solicitante: { id: 999, nombre: usuario?.nombreCompleto ?? 'Usuario' },
      asignadoA: null,
      equipo: contexto.ipRegistrada ? { id: contexto.idEquipo!, hostname: contexto.hostname, ip: contexto.ip } : null,
      ipOrigen: contexto.ip,
      anexoContacto: dto.anexoContacto ?? contexto.anexo,
      fechaCreacion: isoLima(ahoraMs),
      fechaAsignacion: null,
      fechaLimiteRespuesta: isoLima(ahoraMs + tiempos.respuesta * 60_000),
      fechaLimiteResolucion: isoLima(ahoraMs + tiempos.resolucion * 60_000),
      fechaRespuestaReal: null,
      fechaResolucionReal: null,
      fechaCierre: null,
      historial: [{
        fecha: isoLima(ahoraMs),
        usuario: usuario?.nombreCompleto ?? 'Usuario',
        estadoAnterior: null,
        estadoNuevo: EstadoTicket.NUEVO,
        comentario: 'Ticket registrado',
      }],
      escalamientos: [],
      soluciones: [],
    };
    this.tickets.unshift(ticket);
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  listar(f: TicketFiltros, p: Paginacion): Observable<Pagina<TicketResumen>> {
    const texto = (f.texto ?? '').trim().toLowerCase();
    const filtrados = this.tickets.filter(t =>
      (!f.estado || t.estado === f.estado) &&
      (!f.prioridad || t.prioridad === f.prioridad) &&
      (f.idArea === '' || f.idArea == null || t.area.id === f.idArea) &&
      (!texto || t.titulo.toLowerCase().includes(texto) || t.codigo.toLowerCase().includes(texto))
    );
    return of(this.paginar(filtrados, p)).pipe(delay(RETARDO_MS));
  }

  misTickets(p: Paginacion): Observable<Pagina<TicketResumen>> {
    const nombre = this.authService.usuarioActual()?.nombreCompleto;
    const mios = this.tickets.filter(t => t.solicitante.nombre === nombre);
    return of(this.paginar(mios, p)).pipe(delay(RETARDO_MS));
  }

  obtener(id: number): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    return ticket ? of(structuredClone(ticket)).pipe(delay(RETARDO_MS)) : errorMock(404, 'Ticket no encontrado');
  }

  tecnicos(): Observable<Tecnico[]> {
    return of(TECNICOS_MOCK).pipe(delay(RETARDO_MS));
  }

  categorias(): Observable<Categoria[]> {
    return of(CATEGORIAS_MOCK).pipe(delay(RETARDO_MS));
  }

  areas(): Observable<Area[]> {
    return of(AREAS_MOCK).pipe(delay(RETARDO_MS));
  }

  asignar(id: number, idTecnico: number, comentario?: string): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    const tecnico = TECNICOS_MOCK.find(t => t.id === idTecnico);
    if (!ticket) return errorMock(404, 'Ticket no encontrado');
    if (!tecnico) return errorMock(400, 'El técnico seleccionado no existe');
    if (ticket.estado !== EstadoTicket.NUEVO && ticket.estado !== EstadoTicket.REABIERTO) {
      return errorMock(409, 'Solo se puede asignar un ticket en estado Nuevo o Reabierto');
    }
    const anterior = ticket.estado;
    ticket.asignadoA = { id: tecnico.id, nombre: tecnico.nombreCompleto };
    ticket.estado = EstadoTicket.ASIGNADO;
    ticket.fechaAsignacion = isoLima(Date.now());
    this.agregarHistorial(ticket, anterior, EstadoTicket.ASIGNADO, comentario || `Asignado a ${tecnico.nombreCompleto}`);
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  tomar(id: number): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return errorMock(404, 'Ticket no encontrado');
    if (ticket.estado !== EstadoTicket.NUEVO && ticket.estado !== EstadoTicket.REABIERTO) {
      return errorMock(409, 'Solo se puede tomar un ticket en estado Nuevo o Reabierto');
    }
    const usuario = this.authService.usuarioActual();
    const anterior = ticket.estado;
    ticket.asignadoA = { id: 900, nombre: usuario?.nombreCompleto ?? 'Usuario' };
    ticket.estado = EstadoTicket.ASIGNADO;
    ticket.fechaAsignacion = isoLima(Date.now());
    this.agregarHistorial(ticket, anterior, EstadoTicket.ASIGNADO, 'Ticket tomado por el técnico');
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  cambiarEstado(id: number, accion: AccionEstado, texto?: string): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return errorMock(404, 'Ticket no encontrado');
    const ahora = isoLima(Date.now());
    const anterior = ticket.estado;

    if (accion === 'iniciar' && (ticket.estado === EstadoTicket.ASIGNADO || ticket.estado === EstadoTicket.REABIERTO)) {
      ticket.estado = EstadoTicket.EN_PROCESO;
      ticket.fechaRespuestaReal = ticket.fechaRespuestaReal ?? ahora;
      this.agregarHistorial(ticket, anterior, ticket.estado, texto || 'Inicio de atención');
    } else if (accion === 'cerrar' && ticket.estado === EstadoTicket.RESUELTO) {
      ticket.estado = EstadoTicket.CERRADO;
      ticket.fechaCierre = ahora;
      this.agregarHistorial(ticket, anterior, ticket.estado, texto || 'Cierre con conformidad del usuario');
    } else if (accion === 'reabrir' && ticket.estado === EstadoTicket.RESUELTO) {
      ticket.estado = EstadoTicket.REABIERTO;
      ticket.fechaResolucionReal = null;
      this.agregarHistorial(ticket, anterior, ticket.estado, texto || 'Ticket reabierto');
    } else {
      return errorMock(409, `La acción "${accion}" no es válida para el estado ${ticket.estado}`);
    }
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  escalar(id: number, motivo: string): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return errorMock(404, 'Ticket no encontrado');
    if (ticket.estado !== EstadoTicket.EN_PROCESO) {
      return errorMock(409, 'Solo se puede escalar un ticket en atención');
    }
    const usuario = this.authService.usuarioActual()?.nombreCompleto ?? 'Técnico';
    const fecha = isoLima(Date.now());
    const nivelOrigen = ticket.nivelSoporte;
    ticket.estado = EstadoTicket.ESCALADO;
    ticket.nivelSoporte = NivelSoporte.N2;
    ticket.escalamientos.push({ fecha, nivelOrigen, nivelDestino: NivelSoporte.N2, usuarioOrigen: usuario, usuarioDestino: null, motivo });
    this.agregarHistorial(ticket, EstadoTicket.EN_PROCESO, EstadoTicket.ESCALADO, motivo);
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  resolver(id: number, solucion: string): Observable<Ticket> {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return errorMock(404, 'Ticket no encontrado');
    if (ticket.estado !== EstadoTicket.EN_PROCESO && ticket.estado !== EstadoTicket.ESCALADO) {
      return errorMock(409, 'Solo se puede resolver un ticket en atención o derivado');
    }
    const usuario = this.authService.usuarioActual()?.nombreCompleto ?? 'Técnico';
    const fecha = isoLima(Date.now());
    const anterior = ticket.estado;
    ticket.estado = EstadoTicket.RESUELTO;
    ticket.fechaResolucionReal = fecha;
    ticket.estadoSla = new Date(ticket.fechaLimiteResolucion!).getTime() >= Date.now() ? EstadoSLA.A_TIEMPO : EstadoSLA.INCUMPLIDO;
    ticket.soluciones.push({ fecha, usuario, descripcion: solucion, esSolucionFinal: true });
    this.agregarHistorial(ticket, anterior, EstadoTicket.RESUELTO, solucion);
    return of(structuredClone(ticket)).pipe(delay(RETARDO_MS));
  }

  private agregarHistorial(ticket: Ticket, anterior: EstadoTicket, nuevo: EstadoTicket, comentario: string): void {
    ticket.historial.push({
      fecha: isoLima(Date.now()),
      usuario: this.authService.usuarioActual()?.nombreCompleto ?? 'Usuario',
      estadoAnterior: anterior,
      estadoNuevo: nuevo,
      comentario,
    });
  }

  private paginar(tickets: Ticket[], p: Paginacion): Pagina<TicketResumen> {
    const ordenados = [...tickets].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
    const inicio = p.pagina * p.tamano;
    return {
      contenido: ordenados.slice(inicio, inicio + p.tamano).map(resumenDe),
      pagina: p.pagina,
      tamano: p.tamano,
      totalElementos: ordenados.length,
      totalPaginas: Math.ceil(ordenados.length / p.tamano),
    };
  }
}