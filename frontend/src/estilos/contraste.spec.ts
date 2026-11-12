import { describe, it, expect } from 'vitest';

/**
 * Calcula la luminancia relativa según especificación WCAG 2.1
 */
function luminanciaRelativa(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r8 = parseInt(cleanHex.substring(0, 2), 16);
  const g8 = parseInt(cleanHex.substring(2, 4), 16);
  const b8 = parseInt(cleanHex.substring(4, 6), 16);

  const [r, g, b] = [r8, g8, b8].map((val) => {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calcula el ratio de contraste entre dos colores hex
 */
function calcularRatioContraste(hex1: string, hex2: string): number {
  const lum1 = luminanciaRelativa(hex1);
  const lum2 = luminanciaRelativa(hex2);
  const masClaro = Math.max(lum1, lum2);
  const masOscuro = Math.min(lum1, lum2);
  return (masClaro + 0.05) / (masOscuro + 0.05);
}

describe('Accesibilidad WCAG 2.1 AA — Ratios de Contraste del Design System', () => {
  const PARES_TEXTO_AA = [
    { nombre: 'Texto principal (#0F172A) sobre Blanco (#FFFFFF)', texto: '#0F172A', fondo: '#FFFFFF', min: 4.5 },
    { nombre: 'Texto principal (#0F172A) sobre Crema (#FAF6F0)', texto: '#0F172A', fondo: '#FAF6F0', min: 4.5 },
    { nombre: 'Texto secundario (#334155) sobre Crema (#FAF6F0)', texto: '#334155', fondo: '#FAF6F0', min: 4.5 },
    { nombre: 'Metadato atenuado (#475569) sobre Blanco (#FFFFFF)', texto: '#475569', fondo: '#FFFFFF', min: 4.5 },
    { nombre: 'Metadato atenuado (#475569) sobre Crema (#FAF6F0)', texto: '#475569', fondo: '#FAF6F0', min: 4.5 },
    { nombre: 'Guinda institucional (#701C1C) sobre Blanco (#FFFFFF)', texto: '#701C1C', fondo: '#FFFFFF', min: 4.5 },
    { nombre: 'Texto blanco sobre Botón Primario Guinda (#701C1C)', texto: '#FFFFFF', fondo: '#701C1C', min: 4.5 },
    { nombre: 'Texto blanco sobre Botón Éxito Verde (#1B5E20)', texto: '#FFFFFF', fondo: '#1B5E20', min: 4.5 },
    { nombre: 'Badge P1 Crítico: Texto (#7F1D1D) sobre Fondo (#FEE2E2)', texto: '#7F1D1D', fondo: '#FEE2E2', min: 4.5 },
    { nombre: 'Badge P2 Alto: Texto (#7C2D12) sobre Fondo (#FFEDD5)', texto: '#7C2D12', fondo: '#FFEDD5', min: 4.5 },
    { nombre: 'Badge P3 Medio: Texto (#78350F) sobre Fondo (#FEF3C7)', texto: '#78350F', fondo: '#FEF3C7', min: 4.5 },
    { nombre: 'Badge P4 Bajo: Texto (#1E3A8A) sobre Fondo (#DBEAFE)', texto: '#1E3A8A', fondo: '#DBEAFE', min: 4.5 },
    { nombre: 'SLA OK: Texto Verde (#113E14) sobre Fondo (#E8F5E9)', texto: '#113E14', fondo: '#E8F5E9', min: 4.5 },
  ];

  for (const par of PARES_TEXTO_AA) {
    it(`debe cumplir ratio >= ${par.min} para: ${par.nombre}`, () => {
      const ratio = calcularRatioContraste(par.texto, par.fondo);
      expect(ratio).toBeGreaterThanOrEqual(par.min);
    });
  }

  it('debe alertar que #64748B sobre crema #FAF6F0 NO alcanza 4.5:1 (justificando el uso de #475569)', () => {
    const ratio = calcularRatioContraste('#64748B', '#FAF6F0');
    expect(ratio).toBeLessThan(4.5);
  });

  it('debe cumplir ratio gráfico >= 3.0 para bordes e íconos interactivos', () => {
    const ratioAmbar = calcularRatioContraste('#D97706', '#FFFFFF');
    expect(ratioAmbar).toBeGreaterThanOrEqual(3.0);
  });
});
