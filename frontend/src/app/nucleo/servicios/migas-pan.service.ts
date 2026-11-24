import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Miga {
  etiqueta: string;
  ruta?: string;
  esPadre?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MigasPanService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly _submigaDinamica = signal<string | null>(null);
  private readonly _migas = signal<readonly Miga[]>([]);
  readonly migas = this._migas.asReadonly();

  private readonly _eventoNavegacionMiga = new Subject<Miga>();
  readonly eventoNavegacionMiga$ = this._eventoNavegacionMiga.asObservable();

  constructor() {
    this.construirMigas();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this._submigaDinamica.set(null);
        this.construirMigas();
      });
  }

  /**
   * Permite a una página o componente con pestañas/subvistas internas
   * definir una submiga dinámica (ej. "Control en vivo" o "Gráficos y Estadísticas").
   */
  establecerSubmiga(etiqueta: string | null): void {
    if (this._submigaDinamica() !== etiqueta) {
      this._submigaDinamica.set(etiqueta);
      this.construirMigas();
    }
  }

  /**
   * Notifica a los componentes cuando el usuario hace clic en una miga previa.
   */
  notificarNavegacionMiga(miga: Miga): void {
    this._eventoNavegacionMiga.next(miga);
  }

  private construirMigas(): void {
    const migasResultado: Miga[] = [];
    let rutaActual: ActivatedRoute | null = this.activatedRoute.root;
    let urlAcumulada = '';

    while (rutaActual) {
      const snapshot = rutaActual.snapshot;
      if (!snapshot) {
        rutaActual = rutaActual.firstChild;
        continue;
      }

      const segmentos = (snapshot.url || []).map(s => s.path).filter(Boolean);
      if (segmentos.length > 0) {
        urlAcumulada += '/' + segmentos.join('/');
      }

      const etiquetaCruda = snapshot.data?.['miga'] || snapshot.title;
      const etiquetaLimpia = this.limpiarEtiqueta(etiquetaCruda);

      if (etiquetaLimpia) {
        const rutaFinal = urlAcumulada || '/';
        const ultimaExistente = migasResultado.length > 0 ? migasResultado[migasResultado.length - 1] : null;

        const esMismaEtiqueta = ultimaExistente &&
          ultimaExistente.etiqueta.trim().toLowerCase() === etiquetaLimpia.trim().toLowerCase();

        const esMismaRuta = ultimaExistente && ultimaExistente.ruta === rutaFinal;

        if (esMismaEtiqueta) {
          // Ignorar duplicación de la misma etiqueta en rutas anidadas
        } else if (esMismaRuta && ultimaExistente) {
          // Actualizar etiqueta si la nueva es más específica
          ultimaExistente.etiqueta = etiquetaLimpia;
        } else {
          migasResultado.push({
            etiqueta: etiquetaLimpia,
            ruta: rutaFinal,
            esPadre: false,
          });
        }
      }

      rutaActual = rutaActual.firstChild;
    }

    // Si hay una submiga dinámica registrada (ej. subpestaña o detalle de elemento)
    const submiga = this._submigaDinamica();
    if (submiga && submiga.trim()) {
      const etiquetaSubmiga = submiga.trim();
      const ultima = migasResultado.length > 0 ? migasResultado[migasResultado.length - 1] : null;
      if (!ultima || ultima.etiqueta.trim().toLowerCase() !== etiquetaSubmiga.toLowerCase()) {
        migasResultado.push({
          etiqueta: etiquetaSubmiga,
          ruta: undefined,
          esPadre: false,
        });
      }
    }

    // Marcar las migas intermedias como padres con enlace, y la última sin enlace
    if (migasResultado.length > 0) {
      for (let i = 0; i < migasResultado.length - 1; i++) {
        migasResultado[i] = {
          ...migasResultado[i],
          esPadre: true,
        };
      }
      const ultimoIndice = migasResultado.length - 1;
      migasResultado[ultimoIndice] = {
        ...migasResultado[ultimoIndice],
        ruta: undefined,
        esPadre: false,
      };
    }

    this._migas.set(migasResultado);
  }

  private limpiarEtiqueta(etiqueta: unknown): string | null {
    if (!etiqueta || typeof etiqueta !== 'string') {
      return null;
    }
    const limpia = etiqueta
      .replace(/\s*[-·|]\s*(Mesa de Ayuda|Service Desk|HSMSI).*/gi, '')
      .replace(/^(Mesa de Ayuda|Service Desk)\s*[-·|]\s*/gi, '')
      .trim();

    return limpia.length > 0 ? limpia : null;
  }
}
