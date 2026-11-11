const PREFIJO = 'borrador:';

export interface BorradorGuardado<T> {
  valor: T;
  guardadoIso: string;
}

export function guardarBorrador(clave: string, valor: unknown): boolean {
  try {
    const payload: BorradorGuardado<unknown> = {
      valor,
      guardadoIso: new Date().toISOString()
    };
    localStorage.setItem(PREFIJO + clave, JSON.stringify(payload));
    return true;
  } catch (error) {
    // Si localStorage falla (modo incógnito, cuota excedida) se registra advertencia sin interrumpir
    return false;
  }
}

export function leerBorrador<T>(clave: string): BorradorGuardado<T> | null {
  try {
    const raw = localStorage.getItem(PREFIJO + clave);
    if (!raw) return null;
    return JSON.parse(raw) as BorradorGuardado<T>;
  } catch (error) {
    return null;
  }
}

export function eliminarBorrador(clave: string): void {
  try {
    localStorage.removeItem(PREFIJO + clave);
  } catch (error) {
    // Manejo seguro
  }
}
