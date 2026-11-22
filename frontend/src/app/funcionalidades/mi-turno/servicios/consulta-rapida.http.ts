import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ActivoResumen } from '../../../compartido/modelos/activo-resumen.model';
import {
  ArticuloResumen,
  ArticuloDetalle,
  mapearArticuloResumen,
  mapearArticuloDetalle,
} from '../../../compartido/modelos/articulo-conocimiento.model';
import { ConocimientoApi } from '../../../compartido/servicios/conocimiento/conocimiento.api';
import { ConsultaRapidaApi } from './consulta-rapida.api';

@Injectable()
export class ConsultaRapidaHttp extends ConsultaRapidaApi {
  private readonly http = inject(HttpClient);
  private readonly conocimientoApi = inject(ConocimientoApi);
  private readonly baseEquipos = `${environment.apiUrl}/equipos`;

  buscarActivos(texto: string): Observable<ActivoResumen[]> {
    let params = new HttpParams();
    if (texto && texto.trim()) {
      params = params.set('texto', texto.trim());
    }
    return this.http.get<ActivoResumen[]>(this.baseEquipos, { params });
  }

  buscarArticulos(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    return this.conocimientoApi.listar({ texto, categoriaId }).pipe(
      map((articulos) => articulos.map((a) => mapearArticuloResumen(a)))
    );
  }

  obtenerArticulo(id: number): Observable<ArticuloDetalle> {
    return this.conocimientoApi.obtenerPorId(id).pipe(
      map((art) => mapearArticuloDetalle(art))
    );
  }

  sugerirArticulos(categoriaId: number): Observable<ArticuloResumen[]> {
    return this.conocimientoApi.listar({ categoriaId }).pipe(
      map((articulos) => articulos.slice(0, 3).map((a) => mapearArticuloResumen(a)))
    );
  }
}

