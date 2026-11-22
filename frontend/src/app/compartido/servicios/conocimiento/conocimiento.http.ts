import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ArticuloConocimiento } from '../../modelos/articulo-conocimiento.model';
import { ArticuloConocimientoDto, mapearArticuloConocimiento } from '../../modelos/articulo-conocimiento.mapper';
import { ConocimientoApi, FiltrosConocimiento } from './conocimiento.api';

@Injectable()
export class ConocimientoHttp extends ConocimientoApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/conocimiento`;

  listar(filtros?: FiltrosConocimiento): Observable<ArticuloConocimiento[]> {
    let params = new HttpParams();
    if (filtros?.texto && filtros.texto.trim()) {
      params = params.set('texto', filtros.texto.trim());
    }
    if (filtros?.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId.toString());
    }
    if (filtros?.soloPublicos) {
      params = params.set('publicado', 'true');
    }

    return this.http
      .get<ArticuloConocimientoDto[] | { contenido: ArticuloConocimientoDto[] }>(this.base, { params })
      .pipe(
        map((res) => {
          const lista = Array.isArray(res) ? res : res.contenido ?? [];
          return lista.map(mapearArticuloConocimiento);
        }),
      );
  }

  obtenerPorId(id: number): Observable<ArticuloConocimiento> {
    return this.http
      .get<ArticuloConocimientoDto>(`${this.base}/${id}`)
      .pipe(map(mapearArticuloConocimiento));
  }

  destacados(): Observable<ArticuloConocimiento[]> {
    return this.http
      .get<ArticuloConocimientoDto[] | { contenido: ArticuloConocimientoDto[] }>(`${this.base}/destacados`)
      .pipe(
        map((res) => {
          const lista = Array.isArray(res) ? res : res.contenido ?? [];
          return lista.map(mapearArticuloConocimiento);
        }),
      );
  }

  votarUtil(id: number, esUtil: boolean): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/voto`, { esUtil });
  }

  crear(payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    const cuerpo: ArticuloConocimientoDto = {
      titulo: payload.titulo,
      resumen: payload.resumen,
      descripcionProblema: payload.resumen,
      contenidoHtml: payload.contenidoHtml,
      solucionTrabajo: payload.contenidoHtml,
      categoriaId: payload.categoriaId,
      palabrasClave: payload.palabrasClave?.join(', '),
      equiposCompatibles: payload.equiposCompatibles?.join(', '),
      publicado: payload.esPublico ?? true,
      esPublico: payload.esPublico ?? true,
    };
    return this.http
      .post<ArticuloConocimientoDto>(this.base, cuerpo)
      .pipe(map(mapearArticuloConocimiento));
  }

  actualizar(id: number, payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    const cuerpo: ArticuloConocimientoDto = {
      id,
      titulo: payload.titulo,
      resumen: payload.resumen,
      descripcionProblema: payload.resumen,
      contenidoHtml: payload.contenidoHtml,
      solucionTrabajo: payload.contenidoHtml,
      categoriaId: payload.categoriaId,
      palabrasClave: payload.palabrasClave?.join(', '),
      equiposCompatibles: payload.equiposCompatibles?.join(', '),
      publicado: payload.esPublico ?? true,
      esPublico: payload.esPublico ?? true,
    };
    return this.http
      .put<ArticuloConocimientoDto>(`${this.base}/${id}`, cuerpo)
      .pipe(map(mapearArticuloConocimiento));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
