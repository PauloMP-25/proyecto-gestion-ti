import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Observable,
  fromEvent,
  merge,
  combineLatest,
  interval,
  NEVER,
} from 'rxjs';
import { map, startWith, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SondeoService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Crea un flujo de sondeo inteligente para refrescar datos en segundo plano.
   *
   * @param fuente$ Fábrica de Observable que produce los datos actualizados.
   * @param intervaloMs Intervalo de repetición en milisegundos (por defecto 30 000 ms).
   * @returns Observable que emite los datos de inmediato y se repite periódicamente,
   *          pausándose cuando la pestaña no es visible o no hay conexión de red,
   *          y reanudando con refresco inmediato al regresar.
   */
  crearSondeo<T>(fuente$: () => Observable<T>, intervaloMs: number = 30000): Observable<T> {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return fuente$();
    }

    const doc = this.document;
    const win = doc.defaultView ?? window;

    // Flujo de visibilidad de la pestaña
    const visibilidad$ = fromEvent(doc, 'visibilitychange').pipe(
      startWith(null),
      map(() => !doc.hidden)
    );

    // Flujo de estado de conexión
    const conexion$ = merge(
      fromEvent(win, 'online').pipe(map(() => true)),
      fromEvent(win, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true)
    );

    // Activo solo cuando la ventana está visible y hay conexión de red
    const activo$ = combineLatest([visibilidad$, conexion$]).pipe(
      map(([visible, online]) => Boolean(visible && online)),
      distinctUntilChanged()
    );

    return activo$.pipe(
      switchMap((activo) => {
        if (!activo) {
          return NEVER;
        }
        return interval(intervaloMs).pipe(startWith(0));
      }),
      switchMap(() => fuente$())
    );
  }
}
