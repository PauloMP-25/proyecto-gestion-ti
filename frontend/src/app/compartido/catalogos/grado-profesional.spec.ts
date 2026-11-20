import { describe, it, expect } from 'vitest';
import {
  GradoProfesional,
  GRADOS_PROFESIONALES,
  nombreVisible,
} from './grado-profesional.enum';

describe('Catálogo de Grados Profesionales y Formateo Institucional', () => {
  it('debe contener los 7 grados profesionales con sus códigos exactos', () => {
    const codigos = GRADOS_PROFESIONALES.map((g) => g.codigo);
    expect(codigos).toEqual([
      GradoProfesional.LIC,
      GradoProfesional.TEC,
      GradoProfesional.DR,
      GradoProfesional.DRA,
      GradoProfesional.MG,
      GradoProfesional.ING,
      GradoProfesional.SIN_GRADO,
    ]);
  });

  it('debe tener prefijo nulo únicamente para SIN_GRADO', () => {
    const sinGrado = GRADOS_PROFESIONALES.find((g) => g.codigo === GradoProfesional.SIN_GRADO);
    expect(sinGrado?.prefijo).toBeNull();
    expect(sinGrado?.etiqueta).toBe('Sin grado');

    const lic = GRADOS_PROFESIONALES.find((g) => g.codigo === GradoProfesional.LIC);
    expect(lic?.prefijo).toBe('Lic.');
  });

  it('nombreVisible debe formatear primer nombre y primer apellido con grado', () => {
    const res = nombreVisible(
      GradoProfesional.LIC,
      'Patricia Elena',
      'Ramos Quispe'
    );
    expect(res).toBe('Lic. Patricia Ramos');
  });

  it('nombreVisible con SIN_GRADO o nulo no debe anteponer ningún prefijo', () => {
    const sinGrado = nombreVisible(
      GradoProfesional.SIN_GRADO,
      'Juan Alberto',
      'Perez Soto'
    );
    expect(sinGrado).toBe('Juan Perez');

    const nulo = nombreVisible(null, 'Carlos', 'Mendoza');
    expect(nulo).toBe('Carlos Mendoza');
  });

  it('nombreVisible con nombres vacíos debe retornar cadena vacía', () => {
    expect(nombreVisible(GradoProfesional.DR, '', '')).toBe('');
    expect(nombreVisible(null, null, null)).toBe('');
  });
});
