import { Injectable, computed, signal } from '@angular/core';

const CLAVE_STORAGE_COLAPSADO = 'hsmsi_menu_colapsado';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private mediaQueryListener?: (e: MediaQueryListEvent) => void;
  private mediaQueryList?: MediaQueryList;

  // Signal que indica si el viewport actual corresponde a dispositivo móvil o tablet (< 1024px)
  readonly esMovil = signal<boolean>(this.detectarMovilInicial());

  // Estado del menú desplegable off-canvas en móviles
  private readonly _abiertoMovil = signal<boolean>(false);

  // Estado colapsado (72px) en pantallas de escritorio
  private readonly _colapsadoEscritorio = signal<boolean>(this.leerPreferenciaColapsado());

  // Signals computados para consumo de la UI
  readonly sidebarAbierto = computed(() => this.esMovil() && this._abiertoMovil());
  readonly sidebarColapsado = computed(() => !this.esMovil() && this._colapsadoEscritorio());

  constructor() {
    this.iniciarObservadorMedia();
  }

  /**
   * Alterna el estado del menú lateral según el tipo de pantalla actual.
   * En móvil abre/cierra el off-canvas; en escritorio expande o colapsa el ancho.
   */
  alternarSidebar(): void {
    if (this.esMovil()) {
      this._abiertoMovil.update(abierto => !abierto);
    } else {
      this._colapsadoEscritorio.update(colapsado => {
        const nuevoEstado = !colapsado;
        this.guardarPreferenciaColapsado(nuevoEstado);
        return nuevoEstado;
      });
    }
  }

  abrirSidebarMovil(): void {
    if (this.esMovil()) {
      this._abiertoMovil.set(true);
    }
  }

  cerrarSidebarMovil(): void {
    this._abiertoMovil.set(false);
  }

  colapsarSidebarDesktop(colapsar: boolean): void {
    if (!this.esMovil()) {
      this._colapsadoEscritorio.set(colapsar);
      this.guardarPreferenciaColapsado(colapsar);
    }
  }

  private detectarMovilInicial(): boolean {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(max-width: 1023.98px)').matches;
    }
    return false;
  }

  private iniciarObservadorMedia(): void {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.mediaQueryList = window.matchMedia('(max-width: 1023.98px)');
      this.mediaQueryListener = (event: MediaQueryListEvent) => {
        const esAhoraMovil = event.matches;
        this.esMovil.set(esAhoraMovil);
        if (!esAhoraMovil) {
          // Al expandirse a escritorio, cerrar el off-canvas móvil
          this._abiertoMovil.set(false);
        }
      };

      if (typeof this.mediaQueryList.addEventListener === 'function') {
        this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
      } else if (typeof (this.mediaQueryList as unknown as { addListener?: (cb: (e: MediaQueryListEvent) => void) => void }).addListener === 'function') {
        (this.mediaQueryList as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(this.mediaQueryListener);
      }
    }
  }

  private leerPreferenciaColapsado(): boolean {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(CLAVE_STORAGE_COLAPSADO) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  }

  private guardarPreferenciaColapsado(colapsado: boolean): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(CLAVE_STORAGE_COLAPSADO, String(colapsado));
      } catch {
        // En entornos de navegación privada o restringida no bloqueamos la app
      }
    }
  }
}
