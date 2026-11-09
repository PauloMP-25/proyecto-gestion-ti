import { Injectable, signal, DestroyRef, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RelojServidorService {
  private destroyRef = inject(DestroyRef);
  private offsetServidor = 0; // Se sincroniza con cabecera Date HTTP del backend

  // Señal reactiva única compartida por todo el árbol de componentes
  readonly ahora = signal<number>(Date.now());

  constructor() {
    const timerId = setInterval(() => {
      this.ahora.set(Date.now() + this.offsetServidor);
    }, 1000);

    this.destroyRef.onDestroy(() => {
      clearInterval(timerId);
    });
  }

  sincronizarConCabeceraHttp(fechaServidorIso: string): void {
    const tiempoServidor = new Date(fechaServidorIso).getTime();
    if (!isNaN(tiempoServidor)) {
      this.offsetServidor = tiempoServidor - Date.now();
      this.ahora.set(Date.now() + this.offsetServidor);
    }
  }

  calcularTiempoRestanteMs(fechaVencimientoIso: string): number {
    const vencimiento = new Date(fechaVencimientoIso).getTime();
    return vencimiento - this.ahora();
  }
}
