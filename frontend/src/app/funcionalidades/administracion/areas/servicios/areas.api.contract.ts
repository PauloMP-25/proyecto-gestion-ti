import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { AreasApi } from './areas.api';
import { AreaFormulario } from '../modelos/areas.model';

export function contratoAreasApi(obtenerInstancia: () => AreasApi): void {
  describe('Contrato unificado AreasApi', () => {
    let api: AreasApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('debe listar áreas iniciales activas', async () => {
      const lista = await firstValueFrom(api.listar({ incluirInactivas: false }));
      expect(Array.isArray(lista)).toBe(true);
      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((a) => a.activo)).toBe(true);
    });

    it('debe filtrar por término de búsqueda ignorando mayúsculas y acentos', async () => {
      const lista = await firstValueFrom(api.listar({ buscar: 'admision' }));
      expect(lista.length).toBeGreaterThanOrEqual(1);
      expect(lista.some((a) => a.nombre.toLowerCase().includes('admisi'))).toBe(true);
    });

    it('debe obtener el detalle de un área existente', async () => {
      const lista = await firstValueFrom(api.listar());
      const primerId = lista[0].id;
      const detalle = await firstValueFrom(api.obtener(primerId));
      expect(detalle.id).toBe(primerId);
      expect(detalle.nombre).toBe(lista[0].nombre);
    });

    it('debe crear una nueva área hospitalaria exitosamente', async () => {
      const form: AreaFormulario = {
        nombre: 'Laboratorio de Bioquímica ' + Date.now(),
        piso: 2,
        referenciaUbicacion: 'Pabellón C, ala norte',
        anexo: '304',
        idEncargado: null,
      };

      const creada = await firstValueFrom(api.crear(form));
      expect(creada.id).toBeGreaterThan(0);
      expect(creada.nombre).toBe(form.nombre);
      expect(creada.activo).toBe(true);
    });

    it('debe rechazar con 409 si el nombre de área ya existe (ej. admision vs Admisión)', async () => {
      const formDuplicado: AreaFormulario = {
        nombre: 'admision',
        piso: 1,
        referenciaUbicacion: null,
        anexo: null,
        idEncargado: null,
      };

      try {
        await firstValueFrom(api.crear(formDuplicado));
        expect.unreachable('Debería haber fallado con 409 Conflicto');
      } catch (err: any) {
        expect(err.status).toBe(409);
        expect(err.error?.campo).toBe('nombre');
      }
    });
  });
}
