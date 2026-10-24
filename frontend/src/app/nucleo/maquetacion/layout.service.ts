import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // En móviles o pantallas chicas el sidebar puede estar abierto o cerrado sobrepuesto
  private _sidebarAbierto = signal<boolean>(false);
  // En pantallas grandes (desktop), el sidebar puede estar expandido o colapsado
  private _sidebarColapsado = signal<boolean>(false);

  readonly sidebarAbierto = this._sidebarAbierto.asReadonly();
  readonly sidebarColapsado = this._sidebarColapsado.asReadonly();

  alternarSidebar(): void {
    if (this.esPantallaMovil()) {
      this._sidebarAbierto.update(v => !v);
    } else {
      this._sidebarColapsado.update(v => !v);
    }
  }

  abrirSidebarMovil(): void {
    this._sidebarAbierto.set(true);
  }

  cerrarSidebarMovil(): void {
    this._sidebarAbierto.set(false);
  }

  colapsarSidebarDesktop(colapsar: boolean): void {
    this._sidebarColapsado.set(colapsar);
  }

  private esPantallaMovil(): boolean {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  }
}
