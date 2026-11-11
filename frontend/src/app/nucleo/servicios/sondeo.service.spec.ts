import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { of, Subscription } from 'rxjs';
import { SondeoService } from './sondeo.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('SondeoService', () => {
  let service: SondeoService;
  let docMock: Document;
  let sub: Subscription | null = null;

  beforeEach(() => {
    vi.useFakeTimers();

    docMock = document;
    // Asegurar estado visible por defecto
    Object.defineProperty(docMock, 'hidden', {
      configurable: true,
      get: () => false,
    });

    TestBed.configureTestingModule({
      providers: [
        SondeoService,
        { provide: DOCUMENT, useValue: docMock },
      ],
    });
    service = TestBed.inject(SondeoService);
  });

  afterEach(() => {
    if (sub) {
      sub.unsubscribe();
      sub = null;
    }
    vi.useRealTimers();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe emitir inmediatamente al suscribirse', () => {
    let conteo = 0;
    const fuente$ = vi.fn(() => of(++conteo));

    const emisiones: number[] = [];
    sub = service.crearSondeo(fuente$, 1000).subscribe((val) => emisiones.push(val));

    expect(emisiones).toEqual([1]);
    expect(fuente$).toHaveBeenCalledTimes(1);
  });

  it('debe emitir periódicamente según el intervalo especificado', () => {
    let conteo = 0;
    const fuente$ = vi.fn(() => of(++conteo));

    const emisiones: number[] = [];
    sub = service.crearSondeo(fuente$, 1000).subscribe((val) => emisiones.push(val));

    expect(emisiones).toEqual([1]);

    vi.advanceTimersByTime(1000);
    expect(emisiones).toEqual([1, 2]);

    vi.advanceTimersByTime(2000);
    expect(emisiones).toEqual([1, 2, 3, 4]);
    expect(fuente$).toHaveBeenCalledTimes(4);
  });

  it('debe pausar el sondeo si document.hidden es true y reanudar inmediatamente al volver a visible', () => {
    let conteo = 0;
    const fuente$ = vi.fn(() => of(++conteo));

    let oculto = false;
    Object.defineProperty(docMock, 'hidden', {
      configurable: true,
      get: () => oculto,
    });

    const emisiones: number[] = [];
    sub = service.crearSondeo(fuente$, 1000).subscribe((val) => emisiones.push(val));

    expect(emisiones).toEqual([1]);

    // Ocultar pestaña
    oculto = true;
    docMock.dispatchEvent(new Event('visibilitychange'));

    // Avanzar tiempo con la pestaña oculta: no debe haber nuevas emisiones
    vi.advanceTimersByTime(3000);
    expect(emisiones).toEqual([1]);
    expect(fuente$).toHaveBeenCalledTimes(1);

    // Volver a la pestaña (visible): debe reanudar de inmediato (refresco inmediato)
    oculto = false;
    docMock.dispatchEvent(new Event('visibilitychange'));

    expect(emisiones).toEqual([1, 2]);
    expect(fuente$).toHaveBeenCalledTimes(2);

    // Continúa con el intervalo normal
    vi.advanceTimersByTime(1000);
    expect(emisiones).toEqual([1, 2, 3]);
  });

  it('debe pausar el sondeo cuando la conexión se pierde (offline) y reanudar al volver (online)', () => {
    let conteo = 0;
    const fuente$ = vi.fn(() => of(++conteo));

    const emisiones: number[] = [];
    sub = service.crearSondeo(fuente$, 1000).subscribe((val) => emisiones.push(val));

    expect(emisiones).toEqual([1]);

    // Disparar offline
    window.dispatchEvent(new Event('offline'));

    vi.advanceTimersByTime(3000);
    expect(emisiones).toEqual([1]);

    // Disparar online
    window.dispatchEvent(new Event('online'));

    // Refresco inmediato al volver la conexión
    expect(emisiones).toEqual([1, 2]);

    vi.advanceTimersByTime(1000);
    expect(emisiones).toEqual([1, 2, 3]);
  });

  it('debe cancelar las emisiones al desuscribirse', () => {
    let conteo = 0;
    const fuente$ = vi.fn(() => of(++conteo));

    const emisiones: number[] = [];
    sub = service.crearSondeo(fuente$, 1000).subscribe((val) => emisiones.push(val));

    expect(emisiones).toEqual([1]);

    sub.unsubscribe();
    sub = null;

    vi.advanceTimersByTime(5000);
    expect(emisiones).toEqual([1]);
    expect(fuente$).toHaveBeenCalledTimes(1);
  });
});
