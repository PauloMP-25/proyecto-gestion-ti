import { Observable } from 'rxjs';
import { ActivoResumen } from '../../../compartido/modelos/activo-resumen.model';
import { ArticuloResumen, ArticuloDetalle } from '../../../compartido/modelos/articulo-conocimiento.model';

export abstract class ConsultaRapidaApi {
  /** Busca equipos/activos por hostname, IP, código o área */
  abstract buscarActivos(texto: string): Observable<ActivoResumen[]>;

  /** Busca guías de solución rápida en la base de conocimientos */
  abstract buscarArticulos(texto: string, categoriaId?: number): Observable<ArticuloResumen[]>;

  /** Obtiene el detalle de una guía de solución con pasos secuenciales */
  abstract obtenerArticulo(id: number): Observable<ArticuloDetalle>;

  /** Sugiere artículos basados en la categoría del ticket en atención */
  abstract sugerirArticulos(categoriaId: number): Observable<ArticuloResumen[]>;
}
