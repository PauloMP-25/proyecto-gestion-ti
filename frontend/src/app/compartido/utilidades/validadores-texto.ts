import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Normaliza un texto eliminando espacios en blanco en extremos y colapsando
 * espacios internos repetidos a uno solo.
 */
export function textoUtil(raw: unknown): string {
  if (raw == null) return '';
  return String(raw).trim().replace(/\s+/g, ' ');
}

export function contarCaracteresUtiles(raw: unknown): number {
  return textoUtil(raw).length;
}

export function tieneMinimoCaracteresUtiles(raw: unknown, min: number): boolean {
  return textoUtil(raw).length >= min;
}

/**
 * Validador que exige un mínimo de caracteres útiles (sin espacios inflados).
 * Opcionalmente verifica que no supere un máximo.
 */
export function minimoCaracteresUtiles(min: number, max?: number): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const n = textoUtil(c.value).length;
    if (n < min) {
      return { minimoUtil: { requerido: min, actual: n } };
    }
    if (max !== undefined && n > max) {
      return { maximo: { max, actual: n } };
    }
    return null;
  };
}

/**
 * Validador opcional: si el campo está vacío es válido; si contiene texto,
 * no debe exceder el límite de caracteres útiles.
 */
export function maximoCaracteresUtiles(max: number): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const n = textoUtil(c.value).length;
    return n > max ? { maximo: { max, actual: n } } : null;
  };
}
