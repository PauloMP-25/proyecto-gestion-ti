import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import {
  ContrasenaTemporalInfo,
  FiltroPersonal,
  PersonalActualizarForm,
  PersonalItem,
  PersonalRegistroForm,
} from '../modelos/personal.model';
import { PersonalApi } from '../servicios/personal.api';

@Injectable()
export class PersonalStore {
  private readonly api = inject(PersonalApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _personal = signal<PersonalItem[]>([]);
  private readonly _total = signal<number>(0);
  private readonly _totalPaginas = signal<number>(1);
  private readonly _cargando = signal<boolean>(false);
  private readonly _filtro = signal<FiltroPersonal>({
    busqueda: '',
    pagina: 0,
    tamano: 10,
  });

  readonly personal = this._personal.asReadonly();
  readonly total = this._total.asReadonly();
  readonly totalPaginas = this._totalPaginas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly vacio = computed(() => !this._cargando() && this._personal().length === 0);

  cargar(f: Partial<FiltroPersonal> = {}): void {
    this._filtro.update((actual) => ({ ...actual, ...f }));
    this._cargando.set(true);

    this.api
      .listar(this._filtro())
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (pag) => {
          this._personal.set(pag.contenido);
          this._total.set(pag.totalElementos);
          this._totalPaginas.set(pag.totalPaginas);
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cargar el listado de personal.';
          this.notificacion.error(mensaje);
        },
      });
  }

  crear(
    formulario: PersonalRegistroForm
  ): Observable<PersonalItem & { contrasenaTemporal?: string }> {
    return this.api.crear(formulario).pipe(
      tap({
        next: (creado) => {
          this.notificacion.exito(`Colaborador(a) "${creado.nombreVisible}" registrado.`);
          this.cargar();
        },
      })
    );
  }

  actualizar(
    id: number,
    formulario: PersonalActualizarForm
  ): Observable<PersonalItem> {
    return this.api.actualizar(id, formulario).pipe(
      tap({
        next: (act) => {
          this.notificacion.exito(`Datos de "${act.nombreVisible}" actualizados.`);
          this.cargar();
        },
      })
    );
  }

  toggleActivo(id: number): Observable<PersonalItem> {
    return this.api.toggleActivo(id).pipe(
      tap({
        next: (act) => {
          const accion = act.activo ? 'activada' : 'desactivada';
          this.notificacion.exito(`Cuenta de "${act.nombreVisible}" ${accion}.`);
          this.cargar();
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cambiar el estado del usuario.';
          this.notificacion.error(mensaje);
        },
      })
    );
  }

  restablecerContrasena(id: number): Observable<ContrasenaTemporalInfo> {
    return this.api.restablecerContrasena(id).pipe(
      tap({
        next: (info) => {
          this.notificacion.exito(`Contraseña restablecida para ${info.nombreCompleto}.`);
        },
      })
    );
  }
}
