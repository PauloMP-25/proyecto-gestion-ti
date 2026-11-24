import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import {
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
  CambioResumen,
  FiltroCambios,
  TransicionCambio,
} from '../modelos/cambios.model';
import {
  AreaSeleccionableDto,
  CambioDetalleDto,
  CambioResumenDto,
  TransicionCambioDto,
} from './cambios.dto';
import {
  aAreaSeleccionable,
  aCambioDetalle,
  aCambioResumen,
  aCambioSolicitudDto,
} from './cambios.mapper';
import { CambiosApi } from './cambios.api';

type RespuestaLista<T> =
  | readonly T[]
  | { readonly contenido?: readonly T[]; readonly datos?: readonly T[] };

type RespuestaIndividual<T> = T | { readonly datos?: T };

function desenvolverLista<T>(respuesta: RespuestaLista<T>): readonly T[] {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }
  const envoltorio = respuesta as {
    readonly contenido?: readonly T[];
    readonly datos?: readonly T[];
  };
  return envoltorio.contenido ?? envoltorio.datos ?? [];
}

function desenvolverIndividual<T>(respuesta: RespuestaIndividual<T>): T {
  if (respuesta && typeof respuesta === 'object' && 'datos' in respuesta && respuesta.datos) {
    return respuesta.datos;
  }
  return respuesta as T;
}

@Injectable()
export class CambiosHttp extends CambiosApi {
  private readonly http = inject(HttpClient);
  private readonly base = API_ENDPOINTS.admin.cambios;

  listar(filtro?: Partial<FiltroCambios>): Observable<CambioResumen[]> {
    let params = new HttpParams();
    if (filtro?.texto?.trim()) {
      params = params.set('texto', filtro.texto.trim());
    }
    if (filtro?.estado) {
      params = params.set('estado', filtro.estado);
    }
    if (filtro?.impacto) {
      params = params.set('impacto', filtro.impacto);
    }
    if (filtro?.tipo) {
      params = params.set('tipo', filtro.tipo);
    }

    return this.http.get<RespuestaLista<CambioResumenDto>>(this.base, { params }).pipe(
      map((respuesta) => desenvolverLista(respuesta).map(aCambioResumen)),
    );
  }

  obtener(id: number): Observable<CambioDetalle> {
    return this.http
      .get<RespuestaIndividual<CambioDetalleDto>>(`${this.base}/${id}`)
      .pipe(map((respuesta) => aCambioDetalle(desenvolverIndividual(respuesta))));
  }

  crear(formulario: CambioFormulario): Observable<CambioDetalle> {
    return this.http
      .post<RespuestaIndividual<CambioDetalleDto>>(this.base, aCambioSolicitudDto(formulario))
      .pipe(map((respuesta) => aCambioDetalle(desenvolverIndividual(respuesta))));
  }

  actualizar(id: number, formulario: CambioFormulario): Observable<CambioDetalle> {
    return this.http
      .put<RespuestaIndividual<CambioDetalleDto>>(
        `${this.base}/${id}`,
        aCambioSolicitudDto(formulario),
      )
      .pipe(map((respuesta) => aCambioDetalle(desenvolverIndividual(respuesta))));
  }

  transicionar(id: number, transicion: TransicionCambio): Observable<CambioDetalle> {
    const cuerpo: TransicionCambioDto = {
      accion: transicion.accion,
      observacion: transicion.observacion?.trim() || null,
    };
    return this.http
      .put<RespuestaIndividual<CambioDetalleDto>>(`${this.base}/${id}/decision`, cuerpo)
      .pipe(map((respuesta) => aCambioDetalle(desenvolverIndividual(respuesta))));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listarAreasSeleccionables(): Observable<AreaAfectada[]> {
    return this.http
      .get<RespuestaLista<AreaSeleccionableDto>>(API_ENDPOINTS.admin.areas)
      .pipe(map((respuesta) => desenvolverLista(respuesta).map(aAreaSeleccionable)));
  }
}
