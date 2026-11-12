import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ArticuloResumen,
  ArticuloDetalle,
} from '../../../compartido/modelos/articulo-conocimiento.model';
import { PortalAyudaApi } from './portal-ayuda.api';

@Injectable()
export class PortalAyudaHttp extends PortalAyudaApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/articulos`;

  buscar(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    let params = new HttpParams();
    if (texto && texto.trim()) {
      params = params.set('q', texto.trim());
    }
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId.toString());
    }
    return this.http.get<ArticuloResumen[]>(`${this.base}/buscar`, { params });
  }

  destacados(): Observable<ArticuloResumen[]> {
    return this.http.get<ArticuloResumen[]>(`${this.base}/destacados`);
  }

  obtener(id: number): Observable<ArticuloDetalle> {
    return this.http.get<ArticuloDetalle>(`${this.base}/${id}`);
  }
}
