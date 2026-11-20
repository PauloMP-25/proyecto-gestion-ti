import { Observable } from 'rxjs';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import {
  ContrasenaTemporalInfo,
  FiltroPersonal,
  PersonalActualizarForm,
  PersonalItem,
  PersonalRegistroForm,
} from '../modelos/personal.model';

export abstract class PersonalApi {
  abstract listar(filtro?: FiltroPersonal): Observable<Pagina<PersonalItem>>;
  abstract obtener(id: number): Observable<PersonalItem>;
  abstract crear(
    formulario: PersonalRegistroForm
  ): Observable<PersonalItem & { contrasenaTemporal?: string }>;
  abstract actualizar(
    id: number,
    formulario: PersonalActualizarForm
  ): Observable<PersonalItem>;
  abstract toggleActivo(id: number): Observable<PersonalItem>;
  abstract restablecerContrasena(id: number): Observable<ContrasenaTemporalInfo>;
}
