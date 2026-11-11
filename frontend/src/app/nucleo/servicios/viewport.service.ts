import { Injectable, inject, signal, NgZone, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  /**
   * Indica si la pantalla es de escritorio (ancho >= 1024px).
   * Según el estándar de diseño: >= 1024px renderiza tabla, < 1024px renderiza tarjetas.
   */
  readonly esDesktop = signal<boolean>(true);

  /**
   * Indica si la pantalla es móvil (< 600px).
   */
  readonly esMovil = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaDesktop = window.matchMedia('(min-width: 1024px)');
      const mediaMovil = window.matchMedia('(max-width: 599.98px)');

      this.esDesktop.set(mediaDesktop.matches);
      this.esMovil.set(mediaMovil.matches);

      const listenerDesktop = (e: MediaQueryListEvent) => {
        this.zone.run(() => this.esDesktop.set(e.matches));
      };
      const listenerMovil = (e: MediaQueryListEvent) => {
        this.zone.run(() => this.esMovil.set(e.matches));
      };

      mediaDesktop.addEventListener?.('change', listenerDesktop);
      mediaMovil.addEventListener?.('change', listenerMovil);

      inject(DestroyRef, { optional: true })?.onDestroy(() => {
        mediaDesktop.removeEventListener?.('change', listenerDesktop);
        mediaMovil.removeEventListener?.('change', listenerMovil);
      });
    }
  }
}
