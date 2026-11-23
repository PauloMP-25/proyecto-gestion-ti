import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface Miga {
  etiqueta: string;
  ruta?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MigasPanService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly _migas = signal<readonly Miga[]>([]);
  readonly migas = this._migas.asReadonly();

  constructor() {
    this.construirMigas();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.construirMigas();
      });
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

      // Si la ruta declara 'miga' en data o title
      const etiquetaMiga = snapshot.data?.['miga'] || snapshot.title;
      if (etiquetaMiga && typeof etiquetaMiga === 'string') {
        migasResultado.push({
          etiqueta: etiquetaMiga,
          ruta: urlAcumulada,
        });
      }

      rutaActual = rutaActual.firstChild;
    }

    // La última miga es la vista actual y no debe ser un enlace navegable
    if (migasResultado.length > 0) {
      const ultimaMiga = migasResultado[migasResultado.length - 1];
      migasResultado[migasResultado.length - 1] = {
        etiqueta: ultimaMiga.etiqueta,
      };
    }

    this._migas.set(migasResultado);
  }
}
