import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import {
  AccionCambio,
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
  CambioResumen,
  ESTADOS_CAMBIO,
  EstadoCambio,
  FILTRO_CAMBIOS_INICIAL,
  FiltroCambios,
  TransicionCambio,
} from '../modelos/cambios.model';
import { CambiosApi } from '../servicios/cambios.api';
import { accionesPermitidas } from '../utilidades/flujo-cambio';

const MENSAJE_TOAST_ACCION: Record<AccionCambio, string> = {
  ENVIAR_EVALUACION: 'Solicitud enviada al comité de evaluación.',
  APROBAR: 'Cambio aprobado.',
  RECHAZAR: 'Solicitud rechazada.',
  DEVOLVER_BORRADOR: 'Se solicitaron correcciones al responsable.',
  INICIAR_EJECUCION: 'Intervención iniciada.',
  MARCAR_IMPLEMENTADO: 'Cambio registrado como implementado.',
};

const MENSAJE_ERROR_CARGA = 'No se pudieron cargar las solicitudes de cambio. Intente nuevamente.';

@Injectable()
export class CambiosStore {
  private readonly api = inject(CambiosApi);
  private readonly notificacion = inject(NotificacionService);

  // ── Estado privado
  private readonly _cambios = signal<CambioResumen[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtro = signal<FiltroCambios>(FILTRO_CAMBIOS_INICIAL);
  private readonly _seleccionado = signal<CambioDetalle | null>(null);
  private readonly _cargandoDetalle = signal(false);
  private readonly _guardando = signal(false);
  private readonly _areas = signal<AreaAfectada[]>([]);

  // ── Lectura pública
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly seleccionado = this._seleccionado.asReadonly();
  readonly cargandoDetalle = this._cargandoDetalle.asReadonly();
  readonly guardando = this._guardando.asReadonly();
  readonly areas = this._areas.asReadonly();

  // ── Derivados
  /** Lista visible: el estado se aplica aquí para poder contar todos los estados. */
  readonly cambios = computed<CambioResumen[]>(() => {
    const estado = this._filtro().estado;
    const lista = this._cambios();
    return estado ? lista.filter((c) => c.estado === estado) : lista;
  });

  readonly vacio = computed(() => !this._cargando() && this.cambios().length === 0);

  readonly filtrosActivos = computed(() => {
    const f = this._filtro();
    return [f.estado, f.impacto, f.tipo].filter((v) => v !== null).length;
  });

  readonly conteoPorEstado = computed<Record<EstadoCambio, number>>(() => {
    const conteo = Object.fromEntries(
      ESTADOS_CAMBIO.map((estado) => [estado, 0]),
    ) as Record<EstadoCambio, number>;
    for (const cambio of this._cambios()) {
      conteo[cambio.estado] += 1;
    }
    return conteo;
  });

  readonly accionesDelSeleccionado = computed<readonly AccionCambio[]>(() => {
    const seleccionado = this._seleccionado();
    return seleccionado ? accionesPermitidas(seleccionado.estado) : [];
  });

  // ── Comandos
  cargar(): void {
    this._cargando.set(true);
    this._error.set(null);

    const { texto, impacto, tipo } = this._filtro();
    this.api
      .listar({ texto, impacto, tipo })
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (lista) => this._cambios.set(lista),
        error: (err) => {
          this._error.set(err?.error?.mensaje || MENSAJE_ERROR_CARGA);
          this.notificacion.error(this._error() ?? MENSAJE_ERROR_CARGA);
        },
      });
  }

  actualizarFiltro(parcial: Partial<FiltroCambios>): void {
    this._filtro.update((actual) => ({ ...actual, ...parcial }));
    this.cargar();
  }

  limpiarFiltros(): void {
    this._filtro.set(FILTRO_CAMBIOS_INICIAL);
    this.cargar();
  }

  abrirDetalle(id: number): void {
    this._cargandoDetalle.set(true);
    this.api
      .obtener(id)
      .pipe(finalize(() => this._cargandoDetalle.set(false)))
      .subscribe({
        next: (detalle) => this._seleccionado.set(detalle),
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'No se pudo cargar la solicitud de cambio.';
          this.notificacion.error(mensaje);
        },
      });
  }

  cerrarDetalle(): void {
    this._seleccionado.set(null);
  }

  cargarAreas(): void {
    if (this._areas().length > 0) {
      return;
    }
    this.api.listarAreasSeleccionables().subscribe({
      next: (areas) => this._areas.set(areas),
      error: () => this._areas.set([]),
    });
  }

  crear(formulario: CambioFormulario): Observable<CambioDetalle> {
    this._guardando.set(true);
    return this.api.crear(formulario).pipe(
      tap({
        next: (creado) => {
          this._cambios.update((lista) => [creado, ...lista]);
          this.notificacion.exito('Solicitud registrada como borrador.');
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo registrar la solicitud de cambio.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }

  actualizar(id: number, formulario: CambioFormulario): Observable<CambioDetalle> {
    this._guardando.set(true);
    return this.api.actualizar(id, formulario).pipe(
      tap({
        next: (actualizado) => {
          this._cambios.update((lista) =>
            lista.map((c) => (c.id === id ? actualizado : c)),
          );
          if (this._seleccionado()?.id === id) {
            this._seleccionado.set(actualizado);
          }
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo actualizar la solicitud de cambio.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }

  transicionar(id: number, transicion: TransicionCambio): Observable<CambioDetalle> {
    this._guardando.set(true);
    return this.api.transicionar(id, transicion).pipe(
      tap({
        next: (actualizado) => {
          this._cambios.update((lista) =>
            lista.map((c) => (c.id === id ? actualizado : c)),
          );
          if (this._seleccionado()?.id === id) {
            this._seleccionado.set(actualizado);
          }
          this.notificacion.exito(MENSAJE_TOAST_ACCION[transicion.accion]);
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo actualizar el estado de la solicitud.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }

  eliminar(id: number): Observable<void> {
    this._guardando.set(true);
    return this.api.eliminar(id).pipe(
      tap({
        next: () => {
          this._cambios.update((lista) => lista.filter((c) => c.id !== id));
          if (this._seleccionado()?.id === id) {
            this._seleccionado.set(null);
          }
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo eliminar la solicitud de cambio.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }
}
