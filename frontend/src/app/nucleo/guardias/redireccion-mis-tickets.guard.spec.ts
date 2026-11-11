import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { redireccionMisTicketsGuard } from './redireccion-mis-tickets.guard';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../modelos/rol.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('redireccionMisTicketsGuard', () => {
  let router: Router;
  let rolSignal = signal<RolUsuario | null>(null);

  beforeEach(() => {
    rolSignal = signal<RolUsuario | null>(null);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            rolActual: rolSignal,
          },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('debe redirigir a /portal/mis-solicitudes si el rol es USUARIO_FINAL', () => {
    rolSignal.set(RolUsuario.USUARIO_FINAL);

    const resultado = TestBed.runInInjectionContext(() =>
      redireccionMisTicketsGuard({} as any, {} as any)
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/portal/mis-solicitudes');
  });

  it('debe permitir el acceso (devolver true) para PRACTICANTE', () => {
    rolSignal.set(RolUsuario.PRACTICANTE);

    const resultado = TestBed.runInInjectionContext(() =>
      redireccionMisTicketsGuard({} as any, {} as any)
    );

    expect(resultado).toBe(true);
  });

  it('debe permitir el acceso (devolver true) para ADMINISTRADOR', () => {
    rolSignal.set(RolUsuario.ADMINISTRADOR);

    const resultado = TestBed.runInInjectionContext(() =>
      redireccionMisTicketsGuard({} as any, {} as any)
    );

    expect(resultado).toBe(true);
  });
});
