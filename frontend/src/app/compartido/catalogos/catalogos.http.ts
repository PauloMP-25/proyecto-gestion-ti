import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_ENDPOINTS } from '../../nucleo/config/api-endpoints';
import { CatalogosApi } from './catalogos.api';
import { GradoProfesional, OpcionGrado } from './grado-profesional.enum';

interface OpcionCatalogoDto {
  codigo: string;
  prefijo: string | null;
  descripcion?: string;
  etiqueta?: string;
  orden: number;
}

@Injectable()
export class CatalogosHttp extends CatalogosApi {
  private readonly http = inject(HttpClient);

  obtenerGradosProfesionales(): Observable<OpcionGrado[]> {
    return this.http
      .get<OpcionCatalogoDto[]>(API_ENDPOINTS.catalogos.gradosProfesionales)
      .pipe(
        map((dtos) =>
          dtos.map((dto) => ({
            codigo: dto.codigo as GradoProfesional,
            etiqueta: dto.descripcion || dto.etiqueta || dto.codigo,
            prefijo: dto.prefijo && dto.prefijo.trim().length > 0 ? dto.prefijo : null,
            orden: dto.orden,
          }))
        )
      );
  }
}
