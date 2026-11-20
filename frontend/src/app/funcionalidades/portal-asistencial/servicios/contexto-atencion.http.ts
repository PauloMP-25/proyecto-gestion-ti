import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ContextoAtencionApi } from './contexto-atencion.api';
import { ContextoAtencion, ReportarProblemaSolicitud } from '../modelos/contexto-atencion.model';
import { Ticket } from '../../../compartido/modelos/ticket.model';
import { TicketMapper } from '../../../compartido/modelos/ticket.mapper';
import { API_ENDPOINTS } from '../../../nucleo/config/api-endpoints';

@Injectable()
export class ContextoAtencionHttp extends ContextoAtencionApi {
  private readonly http = inject(HttpClient);
  private readonly mapper = inject(TicketMapper);

  obtenerContexto(): Observable<ContextoAtencion> {
    return this.http.get<ContextoAtencion>(API_ENDPOINTS.contextoAtencion);
  }

  reportarProblema(solicitud: ReportarProblemaSolicitud): Observable<Ticket> {
    return this.http
      .post(API_ENDPOINTS.reportarProblema, solicitud)
      .pipe(map(res => this.mapper.detalle(res)));
  }
}
