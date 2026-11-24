import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ConocimientoApi } from './conocimiento.api';
import { ArticuloConocimiento } from '../../modelos/articulo-conocimiento.model';

const CATEGORIAS_ESPERADAS = [1, 2, 3, 4, 5];

export function contratoConocimientoApi(obtenerInstancia: () => ConocimientoApi): void {
  describe('Contrato unificado ConocimientoApi', () => {
    let api: ConocimientoApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('debe listar al menos 12 guías cubriendo las 5 categorías', async () => {
      const lista = await firstValueFrom(api.listar());

      expect(lista.length).toBeGreaterThanOrEqual(12);
      for (const categoriaId of CATEGORIAS_ESPERADAS) {
        expect(lista.some((a) => a.categoriaId === categoriaId)).toBe(true);
      }
      expect(lista.some((a) => a.esPublico)).toBe(true);
      expect(lista.some((a) => !a.esPublico)).toBe(true);
    });

    it('cada guía debe traer pasos y precauciones', async () => {
      const lista = await firstValueFrom(api.listar());

      expect(lista.every((a) => (a.pasos ?? []).length > 0)).toBe(true);
      expect(lista.every((a) => (a.precauciones ?? []).length > 0)).toBe(true);
    });

    it('las guías públicas y sin técnico deben advertir precauciones', async () => {
      const lista = await firstValueFrom(api.listar());
      const publicasDirectas = lista.filter((a) => a.esPublico && !a.requiereTecnico);

      expect(publicasDirectas.length).toBeGreaterThan(0);
      expect(publicasDirectas.every((a) => (a.precauciones ?? []).length > 0)).toBe(true);
    });

    it('debe buscar por texto ignorando mayúsculas y tildes', async () => {
      const conTilde = await firstValueFrom(api.listar({ texto: 'sesión' }));
      const sinTilde = await firstValueFrom(api.listar({ texto: 'SESION' }));

      expect(conTilde.length).toBeGreaterThan(0);
      expect(sinTilde.map((a) => a.id)).toEqual(conTilde.map((a) => a.id));
    });

    it('debe filtrar por categoría', async () => {
      const lista = await firstValueFrom(api.listar({ categoriaId: 2 }));

      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((a) => a.categoriaId === 2)).toBe(true);
      expect(lista.every((a) => a.categoriaNombre === 'Impresoras de etiquetas y térmicas')).toBe(
        true,
      );
    });

    it('debe limitar la lista a guías públicas cuando se solicita', async () => {
      const lista = await firstValueFrom(api.listar({ soloPublicos: true }));

      expect(lista.length).toBeGreaterThan(0);
      expect(lista.every((a) => a.esPublico)).toBe(true);
    });

    it('debe obtener el detalle de una guía existente', async () => {
      const lista = await firstValueFrom(api.listar());
      const primera = lista[0];
      const detalle = await firstValueFrom(api.obtenerPorId(primera.id));

      expect(detalle.id).toBe(primera.id);
      expect(detalle.titulo).toBe(primera.titulo);
      expect(detalle.pasos?.length).toBe(primera.pasos?.length);
    });

    it('debe fallar al obtener una guía inexistente', async () => {
      await expect(firstValueFrom(api.obtenerPorId(9999))).rejects.toBeTruthy();
    });

    it('debe devolver como máximo 4 destacados y todos públicos', async () => {
      const destacados = await firstValueFrom(api.destacados());

      expect(destacados.length).toBeGreaterThan(0);
      expect(destacados.length).toBeLessThanOrEqual(4);
      expect(destacados.every((a) => a.esPublico)).toBe(true);
    });

    it('debe incrementar el conteo de utilidad al votar', async () => {
      const lista = await firstValueFrom(api.listar());
      const objetivo = lista[0];

      await firstValueFrom(api.votarUtil(objetivo.id, true));
      const actualizado = await firstValueFrom(api.obtenerPorId(objetivo.id));

      expect(actualizado.conteoUtil).toBe(objetivo.conteoUtil + 1);
    });

    it('debe crear una guía con valores por defecto y categoría oficial', async () => {
      const nueva: Partial<ArticuloConocimiento> = {
        titulo: 'Guía de prueba de red',
        resumen: 'Resumen de prueba para el contrato.',
        categoriaId: 3,
        pasos: ['Primer paso de prueba', 'Segundo paso de prueba'],
        precauciones: ['Precaución de prueba'],
        esPublico: true,
      };

      const creada = await firstValueFrom(api.crear(nueva));

      expect(creada.id).toBeGreaterThan(0);
      expect(creada.titulo).toBe('Guía de prueba de red');
      expect(creada.categoriaNombre).toBe('Redes y conectividad');
      expect(creada.nivelDificultad).toBe('BASICO');
      expect(creada.requiereTecnico).toBe(false);
      expect(creada.pasos).toEqual(nueva.pasos);
      expect(creada.precauciones).toEqual(nueva.precauciones);
    });

    it('debe actualizar una guía conservando su identificador', async () => {
      const lista = await firstValueFrom(api.listar());
      const objetivo = lista[0];

      const actualizada = await firstValueFrom(
        api.actualizar(objetivo.id, { titulo: 'Título actualizado de prueba' }),
      );

      expect(actualizada.id).toBe(objetivo.id);
      expect(actualizada.titulo).toBe('Título actualizado de prueba');
      expect(actualizada.categoriaId).toBe(objetivo.categoriaId);
    });

    it('debe fallar al actualizar una guía inexistente', async () => {
      await expect(
        firstValueFrom(api.actualizar(9999, { titulo: 'No existe' })),
      ).rejects.toBeTruthy();
    });

    it('debe eliminar una guía existente', async () => {
      const creada = await firstValueFrom(
        api.crear({ titulo: 'Guía a eliminar', resumen: 'Se eliminará en la prueba.' }),
      );

      await firstValueFrom(api.eliminar(creada.id));

      await expect(firstValueFrom(api.obtenerPorId(creada.id))).rejects.toBeTruthy();
    });
  });
}
