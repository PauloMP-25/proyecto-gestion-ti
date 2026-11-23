import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { NotificacionService } from '../../../nucleo/servicios/notificacion.service';
import {
  DevolverPrestamoForm,
  EntregarPrestamoForm,
  FiltroPrestamos,
  MetricasPrestamo,
  PrestamoItem,
} from '../modelos/prestamos.model';
import { PrestamosApi } from '../servicios/prestamos.api';

@Injectable()
export class PrestamosStore {
  private readonly api = inject(PrestamosApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _prestamos = signal<PrestamoItem[]>([]);
  private readonly _cargando = signal<boolean>(false);
  private readonly _guardando = signal<boolean>(false);
  private readonly _filtro = signal<FiltroPrestamos>({ estado: 'TODOS', buscar: '' });

  readonly prestamos = this._prestamos.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly guardando = this._guardando.asReadonly();
  readonly filtro = this._filtro.asReadonly();

  readonly metricas = computed<MetricasPrestamo>(() => {
    const lista = this._prestamos();
    const vigentes = lista.filter((p) => p.estado === 'VIGENTE').length;
    const vencidos = lista.filter((p) => p.estado === 'VENCIDO').length;
    const devueltos = lista.filter((p) => p.estado === 'DEVUELTO').length;
    return {
      total: lista.length,
      vigentes,
      vencidos,
      devueltos,
    };
  });

  readonly prestamosFiltrados = computed(() => {
    const f = this._filtro();
    let lista = this._prestamos();

    if (f.estado && f.estado !== 'TODOS') {
      lista = lista.filter((p) => p.estado === f.estado);
    }

    if (f.areaId) {
      lista = lista.filter((p) => p.idAreaDestino === f.areaId);
    }

    if (f.buscar && f.buscar.trim()) {
      const q = f.buscar.trim().toLowerCase();
      lista = lista.filter(
        (p) =>
          p.codigoInventario.toLowerCase().includes(q) ||
          p.nombreEquipo.toLowerCase().includes(q) ||
          p.solicitante.toLowerCase().includes(q) ||
          p.nombreAreaDestino.toLowerCase().includes(q)
      );
    }

    return lista;
  });

  readonly vacio = computed(() => !this._cargando() && this.prestamosFiltrados().length === 0);

  cargar(filtroNuevo: Partial<FiltroPrestamos> = {}): void {
    this._filtro.update((actual) => ({ ...actual, ...filtroNuevo }));
    this._cargando.set(true);

    this.api
      .listar(this._filtro())
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({
        next: (items) => this._prestamos.set(items),
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'Error al cargar el registro de préstamos de equipos.';
          this.notificacion.error(mensaje);
        },
      });
  }

  entregarEquipo(formulario: EntregarPrestamoForm, callbackExito?: () => void): void {
    this._guardando.set(true);
    this.api
      .crear(formulario)
      .pipe(finalize(() => this._guardando.set(false)))
      .subscribe({
        next: () => {
          this.notificacion.exito('Entrega de equipo de contingencia registrada exitosamente.');
          this.cargar();
          callbackExito?.();
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'No fue posible registrar la entrega del equipo.';
          this.notificacion.error(mensaje);
        },
      });
  }

  devolverEquipo(id: number, formulario: DevolverPrestamoForm, callbackExito?: () => void): void {
    this._guardando.set(true);
    this.api
      .devolver(id, formulario)
      .pipe(finalize(() => this._guardando.set(false)))
      .subscribe({
        next: () => {
          this.notificacion.exito('Devolución de equipo registrada y actualizada en inventario.');
          this.cargar();
          callbackExito?.();
        },
        error: (err) => {
          const mensaje = err?.error?.mensaje || 'No fue posible registrar la devolución del equipo.';
          this.notificacion.error(mensaje);
        },
      });
  }
}
