import { Injectable, NgZone, DestroyRef, inject, signal } from '@angular/core';

/**
 * Servicio de reloj único para toda la aplicación.
 * - Conteo de referencias: solo corre el temporizador cuando hay vistas consumiéndolo.
 * - Ejecución fuera de NgZone para no disparar ciclos de detección innecesarios.
 * - Pausa automática cuando la pestaña del navegador está oculta (document.hidden).
 * - Refresco inmediato de la señal al volver al primer plano.
 */
@Injectable({ providedIn: 'root' })
export class RelojService {
  private readonly zona = inject(NgZone);
  private readonly _ahora = signal<number>(Date.now());
  readonly ahora = this._ahora.asReadonly();

  private consumidores = 0;
  private intervalo: ReturnType<typeof setInterval> | null = null;
  private listenerVisibilidad: (() => void) | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.listenerVisibilidad = () => {
        if (document.hidden) {
          this.detener();
        } else {
          this.reanudar();
        }
      };
      document.addEventListener('visibilitychange', this.listenerVisibilidad);
    }
  }

  /**
   * Registra un consumidor del reloj. Se vincula al ciclo de vida del componente o página.
   * Al destruirse el consumidor, decrementa la cuenta y si llega a 0, detiene el temporizador.
   */
  usar(destroyRef: DestroyRef): void {
    this.consumidores++;
    this.reanudar();
    destroyRef.onDestroy(() => {
      this.consumidores = Math.max(0, this.consumidores - 1);
      if (this.consumidores === 0) {
        this.detener();
      }
    });
  }

  private reanudar(): void {
    if (this.intervalo || this.consumidores === 0) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    this._ahora.set(Date.now()); // Refresco inmediato al volver
    this.zona.runOutsideAngular(() => {
      this.intervalo = setInterval(() => {
        this._ahora.set(Date.now());
      }, 1000);
    });
  }

  private detener(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
  }
}
