import { FormControl } from '@angular/forms';
import { minimoCaracteresUtiles, maximoCaracteresUtiles, textoUtil } from './validadores-texto';

describe('ValidadoresTexto', () => {
  describe('textoUtil', () => {
    it('debe limpiar espacios en blanco extremos y colapsar internos', () => {
      expect(textoUtil('   hola     mundo   ')).toBe('hola mundo');
      expect(textoUtil(null)).toBe('');
      expect(textoUtil(undefined)).toBe('');
      expect(textoUtil(12345)).toBe('12345');
    });
  });

  describe('minimoCaracteresUtiles', () => {
    const validador = minimoCaracteresUtiles(20, 100);

    it('debe rechazar valor nulo o vacío con actual = 0', () => {
      const c = new FormControl('');
      expect(validador(c)).toEqual({ minimoUtil: { requerido: 20, actual: 0 } });
    });

    it('debe rechazar texto de solo espacios en blanco con actual = 0', () => {
      const c = new FormControl('                ');
      expect(validador(c)).toEqual({ minimoUtil: { requerido: 20, actual: 0 } });
    });

    it('debe rechazar texto con 19 caracteres útiles', () => {
      const c = new FormControl('1234567890123456789'); // 19
      expect(validador(c)).toEqual({ minimoUtil: { requerido: 20, actual: 19 } });
    });

    it('debe no dejarse engañar por espacios repetidos para llegar a 20 caracteres', () => {
      // 10 chars + muchos espacios + 5 chars = 16 chars útiles
      const c = new FormControl('1234567890          12345');
      expect(validador(c)).toEqual({ minimoUtil: { requerido: 20, actual: 16 } });
    });

    it('debe aceptar exactamente 20 caracteres útiles', () => {
      const c = new FormControl('12345678901234567890');
      expect(validador(c)).toBeNull();
    });

    it('debe aceptar texto válido dentro del rango', () => {
      const c = new FormControl('Revisión técnica realizada correctamente en el equipo.');
      expect(validador(c)).toBeNull();
    });

    it('debe rechazar si excede el máximo permitido', () => {
      const textoLargo = 'a'.repeat(105);
      const c = new FormControl(textoLargo);
      expect(validador(c)).toEqual({ maximo: { max: 100, actual: 105 } });
    });
  });

  describe('maximoCaracteresUtiles', () => {
    const validadorMax = maximoCaracteresUtiles(50);

    it('debe permitir vacío', () => {
      const c = new FormControl('');
      expect(validadorMax(c)).toBeNull();
    });

    it('debe permitir texto menor o igual al máximo', () => {
      const c = new FormControl('Insumos menores');
      expect(validadorMax(c)).toBeNull();
    });

    it('debe rechazar texto que supere el máximo', () => {
      const c = new FormControl('a'.repeat(55));
      expect(validadorMax(c)).toEqual({ maximo: { max: 50, actual: 55 } });
    });
  });
});
