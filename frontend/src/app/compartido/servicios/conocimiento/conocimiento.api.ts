import { Observable } from 'rxjs';
import { ArticuloConocimiento } from '../../modelos/articulo-conocimiento.model';

export interface FiltrosConocimiento {
  texto?: string;
  categoriaId?: number;
  soloPublicos?: boolean;
}

export abstract class ConocimientoApi {
  /** Lista artículos de conocimiento aplicando filtros opcionales de búsqueda y rol */
  abstract listar(filtros?: FiltrosConocimiento): Observable<ArticuloConocimiento[]>;

  /** Obtiene un artículo específico por su ID */
  abstract obtenerPorId(id: number): Observable<ArticuloConocimiento>;

  /** Obtiene las guías más consultadas para acceso rápido */
  abstract destacados(): Observable<ArticuloConocimiento[]>;

  /** Registra el voto del usuario sobre si la guía fue de utilidad */
  abstract votarUtil(id: number, esUtil: boolean): Observable<void>;

  /** Crea un nuevo artículo en la base de conocimientos */
  abstract crear(articulo: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento>;

  /** Actualiza un artículo existente */
  abstract actualizar(id: number, articulo: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento>;

  /** Elimina un artículo de la base de conocimientos */
  abstract eliminar(id: number): Observable<void>;
}
