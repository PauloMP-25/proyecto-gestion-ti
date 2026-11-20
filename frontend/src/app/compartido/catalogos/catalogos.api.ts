import { Observable } from 'rxjs';
import { OpcionGrado } from './grado-profesional.enum';

/**
 * Contrato abstracto de catálogos institucionales.
 */
export abstract class CatalogosApi {
  abstract obtenerGradosProfesionales(): Observable<OpcionGrado[]>;
}
