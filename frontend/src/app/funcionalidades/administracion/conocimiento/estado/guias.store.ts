import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { ArticuloConocimiento } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { ConocimientoApi } from '../../../../compartido/servicios/conocimiento/conocimiento.api';
import {
  AmbitoGuia,
  CategoriaGuia,
  FILTRO_GUIAS_INICIAL,
  FiltroGuias,
  GuiaVista,
} from '../modelos/guias.model';
import { CATEGORIAS_GUIA, categoriaPorId } from '../utilidades/categorias-guia';
import { contarPorCategoria, filtrarYOrdenar } from '../utilidades/busqueda-guias';

const MENSAJE_ERROR_CARGA = 'No se pudieron cargar las guías. Intente nuevamente.';

@Injectable()
export class GuiasStore {
  private readonly api = inject(ConocimientoApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _guias = signal<ArticuloConocimiento[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtro = signal<FiltroGuias>(FILTRO_GUIAS_INICIAL);
  private readonly _seleccionadaId = signal<number | null>(null);
  private readonly _guardando = signal(false);

  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly guardando = this._guardando.asReadonly();

  /** Lista completa enriquecida con su categoría. */
  private readonly guiasVista = computed<GuiaVista[]>(() =>
    this._guias().map((guia) => ({ ...guia, categoria: categoriaPorId(guia.categoriaId) })),
  );

  /** Resultado filtrado y ordenado por relevancia. */
  readonly resultados = computed<GuiaVista[]>(() =>
    filtrarYOrdenar(this.guiasVista(), this._filtro()),
  );

  /** Conteo por categoría respetando texto y ámbito, pero no la categoría. */
  readonly conteoPorCategoria = computed<Record<CategoriaGuia, number>>(() => {
    const parcial = contarPorCategoria(this.guiasVista(), this._filtro());
    const conteo = {} as Record<CategoriaGuia, number>;
    for (const definicion of CATEGORIAS_GUIA) {
      conteo[definicion.clave] = parcial[definicion.clave] ?? 0;
    }
    return conteo;
  });

  readonly seleccionada = computed<GuiaVista | null>(
    () => this.guiasVista().find((guia) => guia.id === this._seleccionadaId()) ?? null,
  );

  readonly vacio = computed(() => !this._cargando() && this.resultados().length === 0);

  readonly hayFiltros = computed(() => {
    const filtro = this._filtro();
    return !!filtro.texto || !!filtro.categoria || filtro.ambito !== 'TODOS';
  });

  readonly filtrosActivos = computed(() => {
    const filtro = this._filtro();
    return (filtro.categoria ? 1 : 0) + (filtro.ambito !== 'TODOS' ? 1 : 0);
  });

  cargar(): void {
    this._cargando.set(true);
    this._error.set(null);

    this.api
      .listar()
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (lista) => this._guias.set(lista),
        error: (err) => {
          this._error.set(err?.error?.mensaje || MENSAJE_ERROR_CARGA);
          this.notificacion.error(this._error() ?? MENSAJE_ERROR_CARGA);
        },
      });
  }

  buscar(texto: string): void {
    this._filtro.update((filtro) => ({ ...filtro, texto }));
  }

  seleccionarCategoria(categoria: CategoriaGuia | null): void {
    this._filtro.update((filtro) => ({
      ...filtro,
      categoria: filtro.categoria === categoria ? null : categoria,
    }));
  }

  seleccionarAmbito(ambito: AmbitoGuia): void {
    this._filtro.update((filtro) => ({ ...filtro, ambito }));
  }

  limpiarFiltros(): void {
    this._filtro.set(FILTRO_GUIAS_INICIAL);
  }

  abrirDetalle(id: number): void {
    this._seleccionadaId.set(id);
  }

  cerrarDetalle(): void {
    this._seleccionadaId.set(null);
  }

  crear(payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    this._guardando.set(true);
    return this.api.crear(payload).pipe(
      tap({
        next: (creada) => {
          this._guias.update((lista) => [creada, ...lista]);
          this.notificacion.exito('Guía publicada correctamente.');
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo publicar la guía.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }

  actualizar(
    id: number,
    payload: Partial<ArticuloConocimiento>,
  ): Observable<ArticuloConocimiento> {
    this._guardando.set(true);
    return this.api.actualizar(id, payload).pipe(
      tap({
        next: (actualizada) => {
          this._guias.update((lista) =>
            lista.map((guia) => (guia.id === id ? actualizada : guia)),
          );
          this.notificacion.exito('Guía actualizada correctamente.');
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo actualizar la guía.',
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
          this._guias.update((lista) => lista.filter((guia) => guia.id !== id));
          if (this._seleccionadaId() === id) {
            this._seleccionadaId.set(null);
          }
          this.notificacion.exito('Guía eliminada correctamente.');
        },
        error: (err) => this.notificacion.error(
          err?.error?.mensaje || 'No se pudo eliminar la guía.',
        ),
        finalize: () => this._guardando.set(false),
      }),
    );
  }
}
