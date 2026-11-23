import { Observable } from 'rxjs';
import {
  DevolverPrestamoForm,
  EntregarPrestamoForm,
  FiltroPrestamos,
  PrestamoItem,
} from '../modelos/prestamos.model';

export abstract class PrestamosApi {
  abstract listar(filtro?: FiltroPrestamos): Observable<PrestamoItem[]>;
  abstract obtenerPorId(id: number): Observable<PrestamoItem>;
  abstract listarVencidos(): Observable<PrestamoItem[]>;
  abstract crear(formulario: EntregarPrestamoForm): Observable<PrestamoItem>;
  abstract devolver(id: number, formulario: DevolverPrestamoForm): Observable<PrestamoItem>;
}
