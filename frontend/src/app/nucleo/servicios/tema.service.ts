import { Injectable, signal } from '@angular/core';

export type ModoTema = 'dia' | 'noche';
const CLAVE_STORAGE_TEMA = 'hsmsi_tema_visual';

@Injectable({
  providedIn: 'root',
})
export class TemaService {
  readonly tema = signal<ModoTema>(this.leerTemaInicial());

  constructor() {
    this.aplicarTemaAlDocumento(this.tema());
  }

  alternarTema(): void {
    const nuevoTema: ModoTema = this.tema() === 'dia' ? 'noche' : 'dia';
    this.tema.set(nuevoTema);
    this.aplicarTemaAlDocumento(nuevoTema);
    this.guardarTema(nuevoTema);
  }

  establecerTema(nuevoTema: ModoTema): void {
    this.tema.set(nuevoTema);
    this.aplicarTemaAlDocumento(nuevoTema);
    this.guardarTema(nuevoTema);
  }

  private leerTemaInicial(): ModoTema {
    if (typeof localStorage !== 'undefined') {
      try {
        const guardado = localStorage.getItem(CLAVE_STORAGE_TEMA) as ModoTema;
        if (guardado === 'dia' || guardado === 'noche') {
          return guardado;
        }
      } catch {
        // Fallback si storage está restringido
      }
    }
    // Detección automática por preferencia de sistema operativo
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'noche';
    }
    return 'dia';
  }

  private aplicarTemaAlDocumento(modo: ModoTema): void {
    if (typeof document !== 'undefined') {
      if (modo === 'noche') {
        document.documentElement.setAttribute('data-tema', 'noche');
      } else {
        document.documentElement.removeAttribute('data-tema');
      }
    }
  }

  private guardarTema(modo: ModoTema): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CLAVE_STORAGE_TEMA, modo);
      } catch {
        // Ignorar si storage restringido
      }
    }
  }
}
