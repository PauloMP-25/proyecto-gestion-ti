import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { EquiposApi } from './equipos.api';
import { EquipoFormulario } from '../modelos/equipos.model';

export function contratoEquiposApi(obtenerInstancia: () => EquiposApi): void {
  describe('Contrato unificado EquiposApi', () => {
    let api: EquiposApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('debe listar equipos con paginación', async () => {
      const pag = await firstValueFrom(api.listar({ pagina: 0, tamano: 5 }));
      expect(pag.contenido.length).toBeGreaterThan(0);
      expect(pag.totalElementos).toBeGreaterThan(0);
      expect(pag.pagina).toBe(0);
    });

    it('debe filtrar equipos por término de búsqueda', async () => {
      const pag = await firstValueFrom(api.listar({ buscar: 'PC-ADM-01' }));
      expect(pag.contenido.length).toBe(1);
      expect(pag.contenido[0].codigoInventario).toBe('PC-ADM-01');
    });

    it('debe filtrar equipos por área', async () => {
      const pag = await firstValueFrom(api.listar({ idArea: 1 }));
      expect(pag.contenido.length).toBeGreaterThanOrEqual(4);
      expect(pag.contenido.every((e) => e.idArea === 1)).toBe(true);
    });

    it('debe sugerir el siguiente código de inventario correlativo para un área y tipo', async () => {
      const codigoSugerido = await firstValueFrom(api.sugerirCodigo('COMPUTADORA', 1));
      expect(codigoSugerido).toBe('PC-ADM-05');
    });

    it('debe validar disponibilidad de una IP estática libre', async () => {
      const res = await firstValueFrom(
        api.verificarDisponibilidadIp('192.168.10.99')
      );
      expect(res.disponible).toBe(true);
      expect(res.equipoEnUso).toBeNull();
    });

    it('debe marcar como no disponible una IP ya en uso', async () => {
      const res = await firstValueFrom(
        api.verificarDisponibilidadIp('192.168.10.11')
      );
      expect(res.disponible).toBe(false);
      expect(res.equipoEnUso).toBe('PC-ADM-01');
    });

    it('debe crear un nuevo equipo hospitalario exitosamente', async () => {
      const form: EquipoFormulario = {
        codigoInventario: 'PC-TEST-99',
        tipo: 'COMPUTADORA',
        idArea: 1,
        marcaModelo: 'Lenovo ThinkCentre M70q',
        referenciaUbicacion: 'Módulo de Pruebas',
        ipEstatica: '192.168.10.88',
        hostname: 'pc-test-99',
        mac: '00:1A:2B:3C:99:99',
      };

      const creado = await firstValueFrom(api.crear(form));
      expect(creado.id).toBeGreaterThan(0);
      expect(creado.codigoInventario).toBe('PC-TEST-99');
      expect(creado.ipVigente).toBe('192.168.10.88');
      expect(creado.estado).toBe('EN_SERVICIO');
      expect(creado.activo).toBe(true);
    });

    it('debe rechazar código duplicado con error 409', async () => {
      const formDuplicado: EquipoFormulario = {
        codigoInventario: 'PC-ADM-01',
        tipo: 'COMPUTADORA',
        idArea: 1,
      };

      try {
        await firstValueFrom(api.crear(formDuplicado));
        expect.unreachable('Debería haber fallado con 409 Conflicto');
      } catch (err: any) {
        expect(err.status).toBe(409);
        expect(err.error?.campo).toBe('codigoInventario');
      }
    });

    it('debe cambiar el estado operativo de un equipo', async () => {
      const pag = await firstValueFrom(api.listar());
      const equipo = pag.contenido[0];

      const enMantenimiento = await firstValueFrom(
        api.cambiarEstado(equipo.id, 'EN_MANTENIMIENTO')
      );
      expect(enMantenimiento.estado).toBe('EN_MANTENIMIENTO');

      // Restaurar
      await firstValueFrom(api.cambiarEstado(equipo.id, 'EN_SERVICIO'));
    });
  });
}
