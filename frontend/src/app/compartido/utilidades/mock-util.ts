import { Observable, defer, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export function conLatencia<T>(fn: () => T): Observable<T> {
  const base = environment.mockLatenciaMs;
  return defer(() => {
    fallarSegunQuery();
    return of(fn());
  }).pipe(
    delay(base === 0 ? 0 : base + Math.random() * base)
  );
}

export function fallarSegunQuery(): void {
  if (environment.production) return;
  if (typeof window === 'undefined' || !window.location) return;
  const f = new URLSearchParams(window.location.search).get('mockError');
  if (f === '409' || f === '500') {
    throw new HttpErrorResponse({ status: Number(f), statusText: `Error simulado ${f}` });
  }
  if (f === 'offline') {
    throw new HttpErrorResponse({ status: 0, statusText: 'Sin conexión simulada' });
  }
}

export function paginar<T>(items: T[], pagina: number, tamano: number) {
  const inicio = pagina * tamano;
  const contenido = items.slice(inicio, inicio + tamano);
  return {
    contenido,
    totalElementos: items.length,
    totalPaginas: Math.max(1, Math.ceil(items.length / tamano)),
    pagina,
    tamano,
  };
}
