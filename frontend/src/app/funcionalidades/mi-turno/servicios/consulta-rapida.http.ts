import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActivoResumen } from '../../../compartido/modelos/activo-resumen.model';
import { ArticuloResumen, ArticuloDetalle } from '../../../compartido/modelos/articulo-conocimiento.model';
import { ConsultaRapidaApi } from './consulta-rapida.api';

@Injectable()
export class ConsultaRapidaHttp extends ConsultaRapidaApi {
  private readonly http = inject(HttpClient);
  private readonly baseEquipos = `${environment.apiUrl}/equipos`;
  private readonly baseErrores = `${environment.apiUrl}/errores-conocidos`;

  buscarActivos(texto: string): Observable<ActivoResumen[]> {
    let params = new HttpParams();
    if (texto && texto.trim()) {
      params = params.set('texto', texto.trim());
    }
    return this.http.get<ActivoResumen[]>(this.baseEquipos, { params });
  }

  buscarArticulos(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    let params = new HttpParams();
    if (texto && texto.trim()) {
      params = params.set('texto', texto.trim());
    }
    if (categoriaId) {
      params = params.set('categoriaId', categoriaId.toString());
    }
    return this.http.get<ArticuloResumen[]>(this.baseErrores, { params });
  }

  obtenerArticulo(id: number): Observable<ArticuloDetalle> {
    return this.http.get<ArticuloDetalle>(`${this.baseErrores}/${id}`);
  }

  sugerirArticulos(categoriaId: number): Observable<ArticuloResumen[]> {
    const params = new HttpParams().set('categoriaId', categoriaId.toString());
    return this.http.get<ArticuloResumen[]>(`${this.baseErrores}/sugerencias`, { params });
  }
}
