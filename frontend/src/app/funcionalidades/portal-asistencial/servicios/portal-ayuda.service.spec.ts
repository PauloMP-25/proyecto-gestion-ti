import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { PortalAyudaMock } from './portal-ayuda.mock';

describe('PortalAyudaMock (A1)', () => {
  let servicio: PortalAyudaMock;

  beforeEach(() => {
    servicio = new PortalAyudaMock();
    (servicio as any).latenciaMs = 0;
  });

  it('debe devolver artículos destacados', async () => {
    const destacados = await firstValueFrom(servicio.destacados());
    expect(destacados.length).toBeGreaterThanOrEqual(4);
    expect(destacados.some((d) => d.titulo.includes('GalenHos'))).toBe(true);
  });

  it('debe buscar guías por texto', async () => {
    const resultados = await firstValueFrom(servicio.buscar('impresora'));
    expect(resultados.length).toBe(1);
    expect(resultados[0].titulo).toContain('Impresora');
  });

  it('debe obtener el detalle completo con pasos paso a paso', async () => {
    const detalle = await firstValueFrom(servicio.obtener(1));
    expect(detalle.id).toBe(1);
    expect(detalle.pasos.length).toBeGreaterThan(0);
    expect(detalle.solucionTemporal).toBeTruthy();
  });
});
