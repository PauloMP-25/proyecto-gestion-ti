import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { AreaDetalle, AreaFormulario, AreaResumen, FiltroAreas } from '../modelos/areas.model';
import { AreasApi, EquipoAreaItem, PersonalAreaItem } from '../servicios/areas.api';

@Injectable()
export class AreasStore {
  private readonly api = inject(AreasApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _areas = signal<AreaResumen[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _filtro = signal<FiltroAreas>({ buscar: '', incluirInactivas: false });

  private readonly _areaSeleccionada = signal<AreaDetalle | null>(null);
  private readonly _cargandoDetalle = signal<boolean>(false);
  private readonly _personal = signal<PersonalAreaItem[]>([]);
  private readonly _equipos = signal<EquipoAreaItem[]>([]);

  readonly areas = this._areas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly activas = computed(() => this._areas().filter((a) => a.activo));
  readonly vacio = computed(() => !this._cargando() && this._areas().length === 0);

  readonly areaSeleccionada = this._areaSeleccionada.asReadonly();
  readonly cargandoDetalle = this._cargandoDetalle.asReadonly();
  readonly personal = this._personal.asReadonly();
  readonly computadoras = computed(() =>
    this._equipos().filter((e) => e.tipo === 'COMPUTADORA')
  );
  readonly impresoras = computed(() =>
    this._equipos().filter((e) => e.tipo === 'IMPRESORA')
  );

  cargar(f: Partial<FiltroAreas> = {}): void {
    this._filtro.update((actual) => ({ ...actual, ...f }));
    this._cargando.set(true);

    this.api
      .listar(this._filtro())
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (lista) => this._areas.set(lista),
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cargar las áreas hospitalarias.';
          this.notificacion.error(mensaje);
        },
      });
  }

  obtenerDetalle(id: number): void {
    this._cargandoDetalle.set(true);
    this.api
      .obtener(id)
      .pipe(finalize(() => this._cargandoDetalle.set(false)))
      .subscribe({
        next: (detalle) => {
          this._areaSeleccionada.set(detalle);
          this.cargarPersonalYEquipos(id);
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'No se pudo cargar la información del área.';
          this.notificacion.error(mensaje);
        },
      });
  }

  cargarPersonalYEquipos(idArea: number): void {
    this.api.listarPersonal(idArea).subscribe({
      next: (personal) => this._personal.set(personal),
      error: () => this._personal.set([]),
    });

    this.api.listarEquipos(idArea).subscribe({
      next: (equipos) => this._equipos.set(equipos),
      error: () => this._equipos.set([]),
    });
  }

  crear(formulario: AreaFormulario): Observable<AreaDetalle> {
    return this.api.crear(formulario).pipe(
      tap({
        next: (creada) => {
          this.notificacion.exito(`Área "${creada.nombre}" registrada correctamente.`);
          this.cargar();
        },
      })
    );
  }

  actualizar(id: number, formulario: AreaFormulario): Observable<AreaDetalle> {
    return this.api.actualizar(id, formulario).pipe(
      tap({
        next: (actualizada) => {
          this.notificacion.exito(`Área "${actualizada.nombre}" actualizada.`);
          this.cargar();
          if (this._areaSeleccionada()?.id === id) {
            this._areaSeleccionada.set(actualizada);
          }
        },
      })
    );
  }

  cambiarEstado(id: number, activo: boolean): Observable<AreaDetalle> {
    return this.api.cambiarEstado(id, activo).pipe(
      tap({
        next: (area) => {
          const accion = activo ? 'reactivada' : 'desactivada';
          this.notificacion.exito(`Área "${area.nombre}" ${accion} correctamente.`);
          this.cargar();
          if (this._areaSeleccionada()?.id === id) {
            this._areaSeleccionada.set(area);
          }
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cambiar el estado del área.';
          this.notificacion.error(mensaje);
        },
      })
    );
  }

  eliminar(id: number): Observable<void> {
    return this.api.eliminar(id).pipe(
      tap({
        next: () => {
          this.notificacion.exito('Área eliminada correctamente.');
          this.cargar();
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al eliminar el área hospitalaria.';
          this.notificacion.error(mensaje);
        },
      })
    );
  }

  reasignarPersonal(idArea: number, idUsuario: number): Observable<void> {
    return this.api.reasignarPersonal(idArea, idUsuario).pipe(
      tap({
        next: () => {
          this.notificacion.exito('Colaborador(a) reasignado(a) al área exitosamente.');
          this.obtenerDetalle(idArea);
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al reasignar colaborador.';
          this.notificacion.error(mensaje);
        },
      })
    );
  }
}
