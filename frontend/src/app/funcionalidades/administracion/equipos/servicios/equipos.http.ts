import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import {
  DisponibilidadIp,
  EquipoFormulario,
  EquipoItem,
  FiltroEquipos,
} from '../modelos/equipos.model';
import {
  CodigoSugeridoRespuestaDto,
  DisponibilidadIpRespuestaDto,
  EquipoDetalleDto,
  EquipoResumenDto,
  PaginaRespuestaEquiposDto,
} from './equipos.dto';
import {
  aDisponibilidadIp,
  aEquipoItem,
  aEquipoSolicitudDto,
} from './equipos.mapper';
import { EquiposApi } from './equipos.api';

@Injectable()
export class EquiposHttp extends EquiposApi {
  private readonly http = inject(HttpClient);

  listar(filtro?: FiltroEquipos): Observable<Pagina<EquipoItem>> {
    let params = new HttpParams()
      .set('pagina', String(filtro?.pagina ?? 0))
      .set('tamano', String(filtro?.tamano ?? 20));

    if (filtro?.idArea) {
      params = params.set('idArea', String(filtro.idArea));
    }
    if (filtro?.tipo) {
      params = params.set('tipo', filtro.tipo);
    }
    if (filtro?.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro?.sinIp !== undefined && filtro.sinIp !== null) {
      params = params.set('sinIp', String(filtro.sinIp));
    }
    if (filtro?.buscar && filtro.buscar.trim()) {
      params = params.set('buscar', filtro.buscar.trim());
    }

    return this.http
      .get<PaginaRespuestaEquiposDto<EquipoResumenDto>>(
        API_ENDPOINTS.admin.equipos,
        { params }
      )
      .pipe(
        map((res) => ({
          contenido: res.contenido.map(aEquipoItem),
          pagina: res.pagina,
          tamano: res.tamano,
          totalElementos: res.totalElementos,
          totalPaginas: res.totalPaginas,
        }))
      );
  }

  obtener(id: number): Observable<EquipoItem> {
    return this.http
      .get<EquipoDetalleDto>(`${API_ENDPOINTS.admin.equipos}/${id}`)
      .pipe(map(aEquipoItem));
  }

  crear(formulario: EquipoFormulario): Observable<EquipoItem> {
    const dto = aEquipoSolicitudDto(formulario);
    return this.http
      .post<EquipoDetalleDto>(API_ENDPOINTS.admin.equipos, dto)
      .pipe(map(aEquipoItem));
  }

  actualizar(id: number, formulario: EquipoFormulario): Observable<EquipoItem> {
    const dto = aEquipoSolicitudDto(formulario);
    return this.http
      .put<EquipoDetalleDto>(`${API_ENDPOINTS.admin.equipos}/${id}`, dto)
      .pipe(map(aEquipoItem));
  }

  cambiarEstado(id: number, estado: string): Observable<EquipoItem> {
    return this.http
      .patch<EquipoDetalleDto>(`${API_ENDPOINTS.admin.equipos}/${id}/estado`, {
        estado,
      })
      .pipe(map(aEquipoItem));
  }

  sugerirCodigo(tipo: string, idArea: number): Observable<string> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('idArea', String(idArea));

    return this.http
      .get<CodigoSugeridoRespuestaDto>(
        `${API_ENDPOINTS.admin.equipos}/sugerir-codigo`,
        { params }
      )
      .pipe(map((res) => res.codigoSugerido));
  }

  verificarDisponibilidadIp(
    ip: string,
    idEquipo?: number
  ): Observable<DisponibilidadIp> {
    let params = new HttpParams().set('ip', ip.trim());
    if (idEquipo) {
      params = params.set('idEquipo', String(idEquipo));
    }

    return this.http
      .get<DisponibilidadIpRespuestaDto>(
        API_ENDPOINTS.admin.redIpDisponibilidad,
        { params }
      )
      .pipe(map(aDisponibilidadIp));
  }
}
