import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import {
  DisponibilidadIp,
  EquipoFormulario,
  EquipoItem,
  FiltroEquipos,
} from '../modelos/equipos.model';
import { EquiposApi } from '../servicios/equipos.api';

@Injectable()
export class EquiposStore {
  private readonly api = inject(EquiposApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _equipos = signal<EquipoItem[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _totalPaginas = signal<number>(1);
  private readonly _cargando = signal<boolean>(false);
  private readonly _filtro = signal<FiltroEquipos>({
    buscar: '',
    pagina: 0,
    tamano: 10,
  });

  readonly equipos = this._equipos.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPaginas = this._totalPaginas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly vacio = computed(() => !this._cargando() && this._equipos().length === 0);

  cargar(f: Partial<FiltroEquipos> = {}): void {
    this._filtro.update((actual) => ({ ...actual, ...f }));
    this._cargando.set(true);

    this.api
      .listar(this._filtro())
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (pag) => {
          this._equipos.set(pag.contenido);
          this._total.set(pag.totalElementos);
          this._totalPaginas.set(pag.totalPaginas);
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cargar el listado de equipos.';
          this.notificacion.error(mensaje);
        },
      });
  }

  crear(formulario: EquipoFormulario): Observable<EquipoItem> {
    return this.api.crear(formulario).pipe(
      tap({
        next: (creado) => {
          this.notificacion.exito(`Equipo "${creado.codigoInventario}" registrado exitosamente.`);
          this.cargar();
        },
      })
    );
  }

  actualizar(id: number, formulario: EquipoFormulario): Observable<EquipoItem> {
    return this.api.actualizar(id, formulario).pipe(
      tap({
        next: (act) => {
          this.notificacion.exito(`Equipo "${act.codigoInventario}" actualizado.`);
          this.cargar();
        },
      })
    );
  }

  cambiarEstado(id: number, estado: string): Observable<EquipoItem> {
    return this.api.cambiarEstado(id, estado).pipe(
      tap({
        next: (act) => {
          this.notificacion.exito(`Estado del equipo "${act.codigoInventario}" actualizado.`);
          this.cargar();
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cambiar estado del equipo.';
          this.notificacion.error(mensaje);
        },
      })
    );
  }

  sugerirCodigo(tipo: string, idArea: number): Observable<string> {
    return this.api.sugerirCodigo(tipo, idArea);
  }

  verificarDisponibilidadIp(
    ip: string,
    idEquipo?: number
  ): Observable<DisponibilidadIp> {
    return this.api.verificarDisponibilidadIp(ip, idEquipo);
  }
}
