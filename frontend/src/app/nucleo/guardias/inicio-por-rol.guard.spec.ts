import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { inicioPorRolGuard } from './inicio-por-rol.guard';
import { AuthService } from '../auth/auth.service';
import { RolUsuario } from '../modelos/rol.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('inicioPorRolGuard', () => {
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

  it('debe redirigir a /portal si el rol es USUARIO_FINAL', () => {
    rolSignal.set(RolUsuario.USUARIO_FINAL);

    const resultado = TestBed.runInInjectionContext(() =>
      inicioPorRolGuard({} as any, {} as any)
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/portal');
  });

  it('debe redirigir a /mi-turno si el rol es PRACTICANTE', () => {
    rolSignal.set(RolUsuario.PRACTICANTE);

    const resultado = TestBed.runInInjectionContext(() =>
      inicioPorRolGuard({} as any, {} as any)
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/mi-turno');
  });

  it('debe redirigir a /panel-control si el rol es ADMINISTRADOR', () => {
    rolSignal.set(RolUsuario.ADMINISTRADOR);

    const resultado = TestBed.runInInjectionContext(() =>
      inicioPorRolGuard({} as any, {} as any)
    );

    expect(resultado).toBeInstanceOf(UrlTree);
    expect((resultado as UrlTree).toString()).toBe('/panel-control');
  });
});
