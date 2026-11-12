import { Observable } from 'rxjs';
import {
  ArticuloResumen,
  ArticuloDetalle,
} from '../../../compartido/modelos/articulo-conocimiento.model';

export abstract class PortalAyudaApi {
  /**
   * Busca guías y soluciones frecuentes por texto y categoría opcional.
   */
  abstract buscar(texto: string, categoriaId?: number): Observable<ArticuloResumen[]>;

  /**
   * Obtiene los temas de ayuda más consultados por el personal hospitalario.
   */
  abstract destacados(): Observable<ArticuloResumen[]>;

  /**
   * Obtiene el contenido completo y pasos paso-a-paso de una guía asistencial.
   */
  abstract obtener(id: number): Observable<ArticuloDetalle>;
}
