import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CatalogosApi } from './catalogos.api';
import { GRADOS_PROFESIONALES, OpcionGrado } from './grado-profesional.enum';

@Injectable()
export class CatalogosMock extends CatalogosApi {
  obtenerGradosProfesionales(): Observable<OpcionGrado[]> {
    return of([...GRADOS_PROFESIONALES]);
  }
}
