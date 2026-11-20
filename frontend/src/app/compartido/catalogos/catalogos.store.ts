import { Injectable, inject, signal } from '@angular/core';
import { CatalogosApi } from './catalogos.api';
import { GRADOS_PROFESIONALES, GradoProfesional, OpcionGrado } from './grado-profesional.enum';

@Injectable({
  providedIn: 'root',
})
export class CatalogosStore {
  private readonly api = inject(CatalogosApi);

  private readonly _grados = signal<OpcionGrado[]>([...GRADOS_PROFESIONALES]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _cargado = signal<boolean>(false);

  readonly grados = this._grados.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly cargado = this._cargado.asReadonly();

  cargar(): void {
    if (this._cargado() || this._cargando()) {
      return;
    }
    this._cargando.set(true);
    this.api.obtenerGradosProfesionales().subscribe({
      next: (grados) => {
        if (grados && grados.length > 0) {
          this._grados.set(grados);
        }
        this._cargando.set(false);
        this._cargado.set(true);
      },
      error: () => {
        // En caso de fallo de red, se mantiene el catálogo de respaldo estático
        this._cargando.set(false);
      },
    });
  }

  obtenerPrefijo(codigo: GradoProfesional | string | null | undefined): string | null {
    if (!codigo) return null;
    const opcion = this._grados().find((g) => g.codigo === codigo);
    return opcion?.prefijo ?? null;
  }
}
