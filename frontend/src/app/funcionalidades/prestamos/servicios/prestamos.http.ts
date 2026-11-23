import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../nucleo/config/api-endpoints';
import {
  DevolverPrestamoForm,
  EntregarPrestamoForm,
  FiltroPrestamos,
  PrestamoItem,
} from '../modelos/prestamos.model';
import { PrestamosApi } from './prestamos.api';

@Injectable({
  providedIn: 'root',
})
export class PrestamosHttpService extends PrestamosApi {
  private readonly http = inject(HttpClient);

  listar(filtro?: FiltroPrestamos): Observable<PrestamoItem[]> {
    let params = new HttpParams();
    if (filtro?.estado && filtro.estado !== 'TODOS') {
      params = params.set('estado', filtro.estado);
    }
    if (filtro?.areaId) {
      params = params.set('areaId', filtro.areaId.toString());
    }
    if (filtro?.buscar && filtro.buscar.trim()) {
      params = params.set('buscar', filtro.buscar.trim());
    }

    return this.http.get<PrestamoItem[]>(API_ENDPOINTS.prestamos, { params });
  }

  obtenerPorId(id: number): Observable<PrestamoItem> {
    return this.http.get<PrestamoItem>(`${API_ENDPOINTS.prestamos}/${id}`);
  }

  listarVencidos(): Observable<PrestamoItem[]> {
    return this.http.get<PrestamoItem[]>(`${API_ENDPOINTS.prestamos}/vencidos`);
  }

  crear(formulario: EntregarPrestamoForm): Observable<PrestamoItem> {
    return this.http.post<PrestamoItem>(API_ENDPOINTS.prestamos, formulario);
  }

  devolver(id: number, formulario: DevolverPrestamoForm): Observable<PrestamoItem> {
    return this.http.put<PrestamoItem>(`${API_ENDPOINTS.prestamos}/${id}/devolver`, formulario);
  }
}
