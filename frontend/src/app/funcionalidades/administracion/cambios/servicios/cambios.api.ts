import { Observable } from 'rxjs';
import {
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
  CambioResumen,
  FiltroCambios,
  TransicionCambio,
} from '../modelos/cambios.model';

/** Contrato abstracto de Solicitudes de Cambio Técnico. */
export abstract class CambiosApi {
  abstract listar(filtro?: Partial<FiltroCambios>): Observable<CambioResumen[]>;
  abstract obtener(id: number): Observable<CambioDetalle>;
  abstract crear(formulario: CambioFormulario): Observable<CambioDetalle>;
  abstract actualizar(id: number, formulario: CambioFormulario): Observable<CambioDetalle>;
  abstract transicionar(id: number, transicion: TransicionCambio): Observable<CambioDetalle>;
  abstract eliminar(id: number): Observable<void>;
  abstract listarAreasSeleccionables(): Observable<AreaAfectada[]>;
}
