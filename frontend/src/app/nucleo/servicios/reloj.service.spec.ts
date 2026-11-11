import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { RelojService } from './reloj.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('RelojService', () => {
  let service: RelojService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [RelojService]
    });
    service = TestBed.inject(RelojService);
  });

  afterEach(() => {
    (service as any).detener();
    vi.useRealTimers();
  });

  it('debe crearse con la hora actual y sin intervalo activo inicialmente', () => {
    expect(service).toBeTruthy();
    expect(service.ahora()).toBeGreaterThan(0);
    expect((service as any).intervalo).toBeNull();
  });

  it('debe iniciar el intervalo cuando se agrega el primer consumidor y detenerlo al destruirse', () => {
    let callbacksDestruccion: (() => void)[] = [];
    const mockDestroyRef = {
      destroyed: false,
      onDestroy: (fn: () => void) => {
        callbacksDestruccion.push(fn);
        return () => {};
      }
    } as unknown as DestroyRef;

    // 1. Primer consumidor
    service.usar(mockDestroyRef);
    expect((service as any).consumidores).toBe(1);
    expect((service as any).intervalo).not.toBeNull();

    const horaInicial = service.ahora();
    vi.advanceTimersByTime(1000);
    expect(service.ahora()).toBeGreaterThanOrEqual(horaInicial);

    // 2. Destrucción del consumidor
    callbacksDestruccion.forEach(cb => cb());
    expect((service as any).consumidores).toBe(0);
    expect((service as any).intervalo).toBeNull();
  });

  it('debe mantener el intervalo activo mientras quede al menos un consumidor', () => {
    const callbacks1: (() => void)[] = [];
    const ref1 = { destroyed: false, onDestroy: (fn: () => void) => { callbacks1.push(fn); return () => {}; } } as unknown as DestroyRef;

    const callbacks2: (() => void)[] = [];
    const ref2 = { destroyed: false, onDestroy: (fn: () => void) => { callbacks2.push(fn); return () => {}; } } as unknown as DestroyRef;

    service.usar(ref1);
    service.usar(ref2);
    expect((service as any).consumidores).toBe(2);
    expect((service as any).intervalo).not.toBeNull();

    // Destruye el primero
    callbacks1.forEach(cb => cb());
    expect((service as any).consumidores).toBe(1);
    expect((service as any).intervalo).not.toBeNull();

    // Destruye el segundo -> se detiene
    callbacks2.forEach(cb => cb());
    expect((service as any).consumidores).toBe(0);
    expect((service as any).intervalo).toBeNull();
  });
});
