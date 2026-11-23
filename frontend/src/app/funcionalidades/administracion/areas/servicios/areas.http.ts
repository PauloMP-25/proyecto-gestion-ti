import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { AreaDetalle, AreaFormulario, AreaResumen, FiltroAreas } from '../modelos/areas.model';
import { AreaDetalleDto, AreaResumenDto, CambioEstadoAreaDto } from './areas.dto';
import { aAreaDetalle, aAreaResumen, aAreaSolicitudDto } from './areas.mapper';
import { AreasApi, EquipoAreaItem, PersonalAreaItem } from './areas.api';

@Injectable()
export class AreasHttp extends AreasApi {
  private readonly http = inject(HttpClient);

  listar(filtro?: FiltroAreas): Observable<AreaResumen[]> {
    let params = new HttpParams();
    if (filtro?.buscar && filtro.buscar.trim()) {
      params = params.set('buscar', filtro.buscar.trim());
    }
    if (filtro?.incluirInactivas !== undefined) {
      params = params.set('incluirInactivas', String(filtro.incluirInactivas));
    }

    return this.http
      .get<AreaResumenDto[]>(API_ENDPOINTS.admin.areas, { params })
      .pipe(map((dtos) => dtos.map(aAreaResumen)));
  }

  obtener(id: number): Observable<AreaDetalle> {
    return this.http
      .get<AreaDetalleDto>(`${API_ENDPOINTS.admin.areas}/${id}`)
      .pipe(map(aAreaDetalle));
  }

  crear(formulario: AreaFormulario): Observable<AreaDetalle> {
    const dto = aAreaSolicitudDto(formulario);
    return this.http
      .post<AreaDetalleDto>(API_ENDPOINTS.admin.areas, dto)
      .pipe(map(aAreaDetalle));
  }

  actualizar(id: number, formulario: AreaFormulario): Observable<AreaDetalle> {
    const dto = aAreaSolicitudDto(formulario);
    return this.http
      .put<any>(`${API_ENDPOINTS.admin.areas}/${id}`, dto)
      .pipe(
        map((res) => {
          // El backend puede devolver RespuestaConAdvertencias<AreaDetalle> o AreaDetalleDto directo
          const detalleDto: AreaDetalleDto = res.datos ? res.datos : res;
          return aAreaDetalle(detalleDto);
        })
      );
  }

  cambiarEstado(id: number, activo: boolean): Observable<AreaDetalle> {
    const body: CambioEstadoAreaDto = { activo };
    return this.http
      .patch<AreaDetalleDto>(`${API_ENDPOINTS.admin.areas}/${id}/estado`, body)
      .pipe(map(aAreaDetalle));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.admin.areas}/${id}`);
  }

  listarPersonal(idArea: number, incluirInactivos: boolean = false): Observable<PersonalAreaItem[]> {
    let params = new HttpParams().set('incluirInactivos', String(incluirInactivos));
    return this.http.get<any[]>(`${API_ENDPOINTS.admin.areas}/${idArea}/personal`, { params }).pipe(
      map((items) =>
        items.map((i) => ({
          id: i.id,
          nombreCompleto: i.nombreCompleto || i.nombreVisible || '',
          nombreVisible: i.nombreVisible || i.nombreCompleto || '',
          correo: i.correo || '',
          nombreUsuario: i.nombreUsuario ?? null,
          rol: i.rol || '',
          activo: i.activo ?? true,
          ultimoAcceso: i.ultimoAcceso ?? null,
        }))
      )
    );
  }

  listarEquipos(idArea: number, tipo?: string): Observable<EquipoAreaItem[]> {
    let params = new HttpParams();
    if (tipo) {
      params = params.set('tipo', tipo);
    }
    return this.http.get<any[]>(`${API_ENDPOINTS.admin.areas}/${idArea}/equipos`, { params }).pipe(
      map((items) =>
        items.map((e) => ({
          id: e.id,
          codigoInventario: e.codigoInventario,
          tipo: e.tipo,
          marcaModelo: e.marcaModelo ?? null,
          referenciaUbicacion: e.referenciaUbicacion ?? null,
          ipVigente: e.ipVigente ?? null,
          estado: e.estado || 'EN_SERVICIO',
          activo: e.activo ?? true,
        }))
      )
    );
  }

  reasignarPersonal(idArea: number, idUsuario: number): Observable<void> {
    return this.http
      .post<void>(`${API_ENDPOINTS.admin.areas}/${idArea}/personal`, { idUsuario })
      .pipe(map(() => void 0));
  }
}
