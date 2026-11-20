import { describe, it, expect } from 'vitest';
import {
  formatearPiso,
  aAreaResumen,
  aAreaDetalle,
  aAreaSolicitudDto,
} from './areas.mapper';
import { AreaDetalleDto, AreaResumenDto } from './areas.dto';
import { AreaFormulario } from '../modelos/areas.model';

describe('AreasMapper', () => {
  describe('formatearPiso', () => {
    it('debe formatear pisos conocidos correctamente', () => {
      expect(formatearPiso(0)).toBe('Sótano');
      expect(formatearPiso(1)).toBe('Primer Piso');
      expect(formatearPiso(2)).toBe('Segundo Piso');
    });

    it('debe manejar nulo o indefinido', () => {
      expect(formatearPiso(null)).toBe('Sin piso especificado');
      expect(formatearPiso(undefined)).toBe('Sin piso especificado');
    });

    it('debe manejar pisos mayores a 10', () => {
      expect(formatearPiso(14)).toBe('Piso 14');
    });
  });

  describe('aAreaResumen', () => {
    it('debe transformar AreaResumenDto a AreaResumen con valores por defecto', () => {
      const dto: AreaResumenDto = {
        id: 1,
        nombre: 'Admisión',
        piso: 1,
        ubicacionLegible: 'Primer Piso',
        anexo: '105',
        encargado: { id: 10, nombreVisible: 'Lic. Patricia Ramos' },
        activo: true,
        totalPersonal: 4,
        totalComputadoras: 4,
        totalImpresoras: 2,
      };

      const modelo = aAreaResumen(dto);

      expect(modelo.id).toBe(1);
      expect(modelo.nombre).toBe('Admisión');
      expect(modelo.piso).toBe(1);
      expect(modelo.anexo).toBe('105');
      expect(modelo.encargado?.nombreVisible).toBe('Lic. Patricia Ramos');
      expect(modelo.totalComputadoras).toBe(4);
      expect(modelo.totalImpresoras).toBe(2);
    });
  });

  describe('aAreaDetalle', () => {
    it('debe incluir referencia de ubicación', () => {
      const dto: AreaDetalleDto = {
        id: 2,
        nombre: 'Emergencia',
        piso: 1,
        ubicacionLegible: 'Primer Piso',
        referenciaUbicacion: 'Pabellón de Urgencias',
        anexo: '210',
        encargado: null,
        activo: true,
        totalPersonal: 3,
        totalComputadoras: 1,
        totalImpresoras: 1,
      };

      const detalle = aAreaDetalle(dto);

      expect(detalle.id).toBe(2);
      expect(detalle.referenciaUbicacion).toBe('Pabellón de Urgencias');
      expect(detalle.encargado).toBeNull();
    });
  });

  describe('aAreaSolicitudDto', () => {
    it('debe normalizar espacios y transformar cadenas vacías a nulo', () => {
      const form: AreaFormulario = {
        nombre: '  Farmacia Central  ',
        piso: 1,
        referenciaUbicacion: '   ',
        anexo: ' 120 ',
        idEncargado: null,
      };

      const dto = aAreaSolicitudDto(form);

      expect(dto.nombre).toBe('Farmacia Central');
      expect(dto.piso).toBe(1);
      expect(dto.referenciaUbicacion).toBeNull();
      expect(dto.anexo).toBe('120');
      expect(dto.idEncargado).toBeNull();
    });
  });
});
