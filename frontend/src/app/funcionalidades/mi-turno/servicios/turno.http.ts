import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';
import {
  ResolverTicketPayload,
  EscalarTicketPayload,
} from '../../../compartido/modelos/dialogos-acciones.model';
import {
  TicketTurno,
  ResumenTurno,
  ConsultaTurno,
  TomarTicketPayload,
} from '../modelos/ticket-turno.model';
import {
  TicketTurnoDto,
  ResumenTurnoDto,
  TomarTicketPayloadDto,
  ResolverTicketPayloadDto,
  EscalarTicketPayloadDto,
} from '../modelos/dtos';
import { TurnoApi } from './turno.api';

@Injectable()
export class TurnoHttp extends TurnoApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tickets`;

  resumen(): Observable<ResumenTurno> {
    return this.http.get<ResumenTurnoDto>(`${this.base}/turno/resumen`).pipe(
      map(dto => ({
        asignados: dto.asignados,
        porVencer: dto.porVencer,
        vencidos: dto.vencidos,
        resueltosHoy: dto.resueltosHoy,
        hayP1SinTomar: dto.hayP1SinTomar,
        ahoraServidorIso: dto.ahoraServidorIso || new Date().toISOString(),
      }))
    );
  }

  listar(c: ConsultaTurno): Observable<Pagina<TicketTurno>> {
    let params = new HttpParams()
      .set('pagina', c.pagina.toString())
      .set('tamano', c.tamano.toString());

    if (c.vista === 'POR_TOMAR') {
      params = params.set('asignadoA', 'sinAsignar').set('estado', EstadoTicket.NUEVO);
    } else if (c.vista === 'EN_ATENCION') {
      params = params.set('asignadoA', 'me').set('estados', `${EstadoTicket.ASIGNADO},${EstadoTicket.EN_PROCESO},${EstadoTicket.REABIERTO}`);
    } else if (c.vista === 'HISTORIAL') {
      params = params.set('asignadoA', 'me').set('estados', `${EstadoTicket.RESUELTO},${EstadoTicket.CERRADO},${EstadoTicket.ESCALADO}`);
    }

    if (c.soloP1P2) {
      params = params.set('prioridades', `${Prioridad.P1_CRITICA},${Prioridad.P2_ALTA}`);
    }

    if (c.texto && c.texto.trim()) {
      params = params.set('texto', c.texto.trim());
    }

    return this.http.get<{ contenido: TicketTurnoDto[]; totalElementos: number; totalPaginas: number; pagina: number; tamano: number }>(
      this.base,
      { params }
    ).pipe(
      map(res => ({
        contenido: res.contenido.map(mapearTicketTurno),
        totalElementos: res.totalElementos,
        totalPaginas: res.totalPaginas,
        pagina: res.pagina,
        tamano: res.tamano,
      }))
    );
  }

  obtener(id: number): Observable<TicketTurno> {
    return this.http.get<TicketTurnoDto>(`${this.base}/${id}`).pipe(
      map(mapearTicketTurno)
    );
  }

  tomar(id: number, p: TomarTicketPayload): Observable<TicketTurno> {
    const payload: TomarTicketPayloadDto = { iniciarAtencion: p.iniciarAtencion };
    return this.http.put<TicketTurnoDto>(`${this.base}/${id}/tomar`, payload).pipe(
      map(mapearTicketTurno)
    );
  }

  iniciarAtencion(id: number): Observable<TicketTurno> {
    return this.http.put<TicketTurnoDto>(`${this.base}/${id}/iniciar-atencion`, {}).pipe(
      map(mapearTicketTurno)
    );
  }

  resolver(id: number, p: ResolverTicketPayload): Observable<TicketTurno> {
    const payload: ResolverTicketPayloadDto = {
      diagnostico: p.diagnostico,
      accionRealizada: p.accionRealizada,
      insumosUtilizados: p.insumosUtilizados,
      tipoSolucion: p.tipoSolucion,
      articuloConocimientoId: p.articuloConocimientoId,
    };
    return this.http.post<TicketTurnoDto>(`${this.base}/${id}/solucion`, payload).pipe(
      map(mapearTicketTurno)
    );
  }

  escalar(id: number, p: EscalarTicketPayload): Observable<TicketTurno> {
    const payload: EscalarTicketPayloadDto = {
      motivo: p.motivo,
    };
    return this.http.put<TicketTurnoDto>(`${this.base}/${id}/escalar`, payload).pipe(
      map(mapearTicketTurno)
    );
  }
}

/**
 * Función pura de mapeo DTO -> TicketTurno
 */
export function normalizarPrioridad(raw: unknown): Prioridad {
  const v = String(raw ?? '').toUpperCase();
  if (v === 'P1' || v === 'P1_CRITICA' || v === 'CRITICA') return Prioridad.P1_CRITICA;
  if (v === 'P2' || v === 'P2_ALTA' || v === 'ALTA') return Prioridad.P2_ALTA;
  if (v === 'P3' || v === 'P3_MEDIA' || v === 'MEDIA') return Prioridad.P3_MEDIA;
  if (v === 'P4' || v === 'P4_BAJA' || v === 'BAJA') return Prioridad.P4_BAJA;
  return Prioridad.P3_MEDIA;
}

export function mapearTicketTurno(dto: TicketTurnoDto): TicketTurno {
  return {
    id: dto.id,
    codigo: dto.codigo,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    prioridad: normalizarPrioridad(dto.prioridad),
    estado: (dto.estado as EstadoTicket) || EstadoTicket.NUEVO,
    nivelSoporte: (dto.nivelSoporte as NivelSoporte) || NivelSoporte.N1,
    categoriaId: dto.categoriaId,
    categoriaNombre: dto.categoriaNombre,
    areaNombre: dto.areaNombre,
    solicitanteNombre: dto.solicitanteNombre,
    anexo: dto.anexo || null,
    equipo: dto.equipo
      ? {
          id: dto.equipo.id,
          hostname: dto.equipo.hostname,
          ip: dto.equipo.ip,
          areaId: dto.equipo.areaId,
          area: dto.equipo.area,
          tipo: dto.equipo.tipo as any,
        }
      : null,
    asignadoA: dto.asignadoA
      ? {
          id: dto.asignadoA.id,
          nombre: dto.asignadoA.nombre,
        }
      : null,
    esMio: !!dto.esMio,
    reabierto: !!dto.reabierto,
    fechaCreacionIso: dto.fechaCreacionIso,
    sla: {
      inicioIso: dto.slaVista?.inicioIso || dto.fechaCreacionIso,
      limiteRespuestaIso: dto.slaVista?.limiteRespuestaIso || dto.fechaCreacionIso,
      limiteResolucionIso: dto.slaVista?.limiteResolucionIso || dto.fechaCreacionIso,
      fase: dto.slaVista?.fase || 'RESPUESTA',
      respuestaRealIso: null,
      estadoServidor: Prioridad.P1_CRITICA ? ('A_TIEMPO' as any) : ('A_TIEMPO' as any),
      desfaseServidorMs: dto.ahoraServidorIso ? Date.parse(dto.ahoraServidorIso) - Date.now() : 0,
    },
  };
}
