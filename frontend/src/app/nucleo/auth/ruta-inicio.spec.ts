import { describe, it, expect } from 'vitest';
import { RolUsuario } from '../modelos/rol.enum';
import { rutaInicioPorRol } from './ruta-inicio';

describe('rutaInicioPorRol', () => {
  it('debe devolver /portal para USUARIO_FINAL', () => {
    expect(rutaInicioPorRol(RolUsuario.USUARIO_FINAL)).toBe('/portal');
  });

  it('debe devolver /mi-turno para PRACTICANTE', () => {
    expect(rutaInicioPorRol(RolUsuario.PRACTICANTE)).toBe('/mi-turno');
  });

  it('debe devolver /panel-control para ADMINISTRADOR', () => {
    expect(rutaInicioPorRol(RolUsuario.ADMINISTRADOR)).toBe('/panel-control');
  });

  it('debe devolver /auth/login para null o rol desconocido', () => {
    expect(rutaInicioPorRol(null)).toBe('/auth/login');
  });
});
