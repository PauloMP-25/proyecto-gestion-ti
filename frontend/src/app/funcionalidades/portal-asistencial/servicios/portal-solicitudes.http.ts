import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import { PortalSolicitudesApi } from './portal-solicitudes.api';
import {
  SolicitudResumen,
  SolicitudDetalle,
  ConsultaSolicitudes,
  CalificarPayload,
  CalificacionAtencion,
  ReabrirPayload,
} from '../modelos/solicitud.model';
import {
  SolicitudDto,
  mapearSolicitudResumen,
  mapearSolicitudDetalle,
} from '../modelos/dtos';

@Injectable()
export class PortalSolicitudesHttp extends PortalSolicitudesApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tickets`;

  listar(c: ConsultaSolicitudes): Observable<Pagina<SolicitudResumen>> {
    let params = new HttpParams()
      .set('pagina', c.pagina.toString())
      .set('tamano', c.tamano.toString())
      .set('misSolicitudes', 'true');

    if (c.filtro && c.filtro !== 'TODAS') {
      params = params.set('filtro', c.filtro);
    }
    if (c.texto && c.texto.trim()) {
      params = params.set('texto', c.texto.trim());
    }

    return this.http
      .get<Pagina<SolicitudDto>>(this.base, { params })
      .pipe(
        map((r) => ({
          ...r,
          contenido: (r.contenido || []).map(mapearSolicitudResumen),
        }))
      );
  }

  obtenerDetalle(id: number): Observable<SolicitudDetalle> {
    return this.http
      .get<SolicitudDto>(`${this.base}/${id}`)
      .pipe(map(mapearSolicitudDetalle));
  }

  contarPorConfirmar(): Observable<number> {
    return this.http.get<number>(`${this.base}/mis-solicitudes/por-confirmar/conteo`);
  }

  confirmarSolucion(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/confirmar`, {});
  }

  reabrir(id: number, p: ReabrirPayload): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/reabrir`, p);
  }

  calificar(id: number, p: CalificarPayload): Observable<CalificacionAtencion> {
    return this.http.post<CalificacionAtencion>(`${this.base}/${id}/calificar`, p);
  }
}
