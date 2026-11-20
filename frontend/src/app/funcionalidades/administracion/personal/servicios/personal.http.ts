import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import {
  ContrasenaTemporalInfo,
  FiltroPersonal,
  PersonalActualizarForm,
  PersonalItem,
  PersonalRegistroForm,
} from '../modelos/personal.model';
import {
  PaginaRespuestaPersonalDto,
  RestablecerContrasenaRespuestaDto,
  UsuarioRespuestaDto,
} from './personal.dto';
import {
  aContrasenaTemporalInfo,
  aPersonalItem,
  aUsuarioActualizarRequestDto,
  aUsuarioRegistroRequestDto,
} from './personal.mapper';
import { PersonalApi } from './personal.api';

@Injectable()
export class PersonalHttp extends PersonalApi {
  private readonly http = inject(HttpClient);

  listar(filtro?: FiltroPersonal): Observable<Pagina<PersonalItem>> {
    let params = new HttpParams()
      .set('pagina', String(filtro?.pagina ?? 0))
      .set('tamano', String(filtro?.tamano ?? 10));

    if (filtro?.busqueda && filtro.busqueda.trim()) {
      params = params.set('busqueda', filtro.busqueda.trim());
    }

    return this.http
      .get<PaginaRespuestaPersonalDto<UsuarioRespuestaDto>>(
        API_ENDPOINTS.admin.personal,
        { params }
      )
      .pipe(
        map((res) => ({
          contenido: res.contenido.map(aPersonalItem),
          pagina: res.pagina,
          tamano: res.tamano,
          totalElementos: res.totalElementos,
          totalPaginas: res.totalPaginas,
        }))
      );
  }

  obtener(id: number): Observable<PersonalItem> {
    return this.http
      .get<UsuarioRespuestaDto>(`${API_ENDPOINTS.admin.personal}/${id}`)
      .pipe(map(aPersonalItem));
  }

  crear(
    formulario: PersonalRegistroForm
  ): Observable<PersonalItem & { contrasenaTemporal?: string }> {
    const dto = aUsuarioRegistroRequestDto(formulario);
    return this.http
      .post<UsuarioRespuestaDto>(API_ENDPOINTS.admin.personal, dto)
      .pipe(
        map((res) => {
          const item = aPersonalItem(res);
          return {
            ...item,
            contrasenaTemporal: res.contrasenaTemporal || undefined,
          };
        })
      );
  }

  actualizar(
    id: number,
    formulario: PersonalActualizarForm
  ): Observable<PersonalItem> {
    const dto = aUsuarioActualizarRequestDto(formulario);
    return this.http
      .put<UsuarioRespuestaDto>(`${API_ENDPOINTS.admin.personal}/${id}`, dto)
      .pipe(map(aPersonalItem));
  }

  toggleActivo(id: number): Observable<PersonalItem> {
    return this.http
      .patch<UsuarioRespuestaDto>(
        `${API_ENDPOINTS.admin.personal}/${id}/activo`,
        {}
      )
      .pipe(map(aPersonalItem));
  }

  restablecerContrasena(id: number): Observable<ContrasenaTemporalInfo> {
    return this.http
      .post<RestablecerContrasenaRespuestaDto>(
        `${API_ENDPOINTS.admin.personal}/${id}/restablecer-contrasena`,
        {}
      )
      .pipe(map(aContrasenaTemporalInfo));
  }
}
