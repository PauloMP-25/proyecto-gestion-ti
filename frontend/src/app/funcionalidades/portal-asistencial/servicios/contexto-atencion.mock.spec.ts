import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ContextoAtencionMock } from './contexto-atencion.mock';
import { contratoContextoAtencionApi } from './contexto-atencion.api.contract';

describe('ContextoAtencionMock', () => {
  let mock: ContextoAtencionMock;

  beforeEach(() => {
    mock = new ContextoAtencionMock();
  });

  contratoContextoAtencionApi(() => mock);

  it('debe permitir simular contexto no registrado', async () => {
    mock.simularContexto({
      estadoDeteccion: 'IP_NO_REGISTRADA',
      equipo: null,
      area: null,
      impresorasArea: [],
    });

    const ctx = await firstValueFrom(mock.obtenerContexto());
    expect(ctx.estadoDeteccion).toBe('IP_NO_REGISTRADA');
    expect(ctx.equipo).toBeNull();
    expect(ctx.area).toBeNull();
  });

  it('debe permitir simular colaborador en otra área', async () => {
    mock.simularContexto({
      personaEnOtraArea: true,
      area: {
        id: 2,
        nombre: 'Emergencia',
        ubicacionLegible: 'Primer Piso',
        referenciaUbicacion: 'Módulo de Triaje',
        anexo: '210',
        encargado: null,
      },
    });

    const ctx = await firstValueFrom(mock.obtenerContexto());
    expect(ctx.personaEnOtraArea).toBe(true);
    expect(ctx.area?.nombre).toBe('Emergencia');
    expect(ctx.persona?.areaAdscrita?.nombre).toBe('Admisión');
  });
});
