import { Observable } from 'rxjs';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import {
  DisponibilidadIp,
  EquipoFormulario,
  EquipoItem,
  FiltroEquipos,
} from '../modelos/equipos.model';

export abstract class EquiposApi {
  abstract listar(filtro?: FiltroEquipos): Observable<Pagina<EquipoItem>>;
  abstract obtener(id: number): Observable<EquipoItem>;
  abstract crear(formulario: EquipoFormulario): Observable<EquipoItem>;
  abstract actualizar(id: number, formulario: EquipoFormulario): Observable<EquipoItem>;
  abstract cambiarEstado(id: number, estado: string): Observable<EquipoItem>;
  abstract sugerirCodigo(tipo: string, idArea: number): Observable<string>;
  abstract verificarDisponibilidadIp(
    ip: string,
    idEquipo?: number
  ): Observable<DisponibilidadIp>;
}
