import { Observable } from 'rxjs';
import { AreaDetalle, AreaFormulario, AreaResumen, FiltroAreas } from '../modelos/areas.model';

export interface PersonalAreaItem {
  readonly id: number;
  readonly nombreCompleto: string;
  readonly nombreVisible: string;
  readonly correo: string;
  readonly nombreUsuario?: string | null;
  readonly rol: string;
  readonly activo: boolean;
  readonly ultimoAcceso?: string | null;
}

export interface EquipoAreaItem {
  readonly id: number;
  readonly codigoInventario: string;
  readonly tipo: string;
  readonly marcaModelo?: string | null;
  readonly referenciaUbicacion?: string | null;
  readonly ipVigente?: string | null;
  readonly estado: string;
  readonly activo: boolean;
}

/**
 * Contrato abstracto de la API de gestión de áreas hospitalarias.
 */
export abstract class AreasApi {
  abstract listar(filtro?: FiltroAreas): Observable<AreaResumen[]>;
  abstract obtener(id: number): Observable<AreaDetalle>;
  abstract crear(formulario: AreaFormulario): Observable<AreaDetalle>;
  abstract actualizar(id: number, formulario: AreaFormulario): Observable<AreaDetalle>;
  abstract cambiarEstado(id: number, activo: boolean): Observable<AreaDetalle>;
  abstract eliminar(id: number): Observable<void>;
  abstract listarPersonal(idArea: number, incluirInactivos?: boolean): Observable<PersonalAreaItem[]>;
  abstract listarEquipos(idArea: number, tipo?: string): Observable<EquipoAreaItem[]>;
  abstract reasignarPersonal(idArea: number, idUsuario: number): Observable<void>;
}
