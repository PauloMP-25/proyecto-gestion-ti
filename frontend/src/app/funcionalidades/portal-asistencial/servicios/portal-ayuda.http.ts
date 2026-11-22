import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ArticuloResumen,
  ArticuloDetalle,
  mapearArticuloResumen,
  mapearArticuloDetalle,
} from '../../../compartido/modelos/articulo-conocimiento.model';
import { ConocimientoApi } from '../../../compartido/servicios/conocimiento/conocimiento.api';
import { PortalAyudaApi } from './portal-ayuda.api';

@Injectable()
export class PortalAyudaHttp extends PortalAyudaApi {
  private readonly conocimientoApi = inject(ConocimientoApi);

  buscar(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    return this.conocimientoApi.listar({ texto, categoriaId, soloPublicos: true }).pipe(
      map((articulos) => articulos.map((a) => mapearArticuloResumen(a)))
    );
  }

  destacados(): Observable<ArticuloResumen[]> {
    return this.conocimientoApi.destacados().pipe(
      map((articulos) => articulos.map((a) => mapearArticuloResumen(a)))
    );
  }

  obtener(id: number): Observable<ArticuloDetalle> {
    return this.conocimientoApi.obtenerPorId(id).pipe(
      map((art) => mapearArticuloDetalle(art))
    );
  }
}

