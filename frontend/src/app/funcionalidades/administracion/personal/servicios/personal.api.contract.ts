import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { PersonalApi } from './personal.api';
import { GradoProfesional } from '../../../../compartido/catalogos/grado-profesional.enum';
import { PersonalRegistroForm } from '../modelos/personal.model';

export function contratoPersonalApi(obtenerInstancia: () => PersonalApi): void {
  describe('Contrato unificado PersonalApi', () => {
    let api: PersonalApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('debe listar colaboradores con paginación', async () => {
      const pag = await firstValueFrom(api.listar({ pagina: 0, tamano: 5 }));
      expect(pag.contenido.length).toBeGreaterThan(0);
      expect(pag.totalElementos).toBeGreaterThan(0);
      expect(pag.pagina).toBe(0);
    });

    it('debe filtrar colaboradores por término de búsqueda', async () => {
      const pag = await firstValueFrom(api.listar({ busqueda: 'patricia' }));
      expect(pag.contenido.length).toBeGreaterThanOrEqual(1);
      expect(
        pag.contenido.some((p) => p.nombreVisible.toLowerCase().includes('patricia'))
      ).toBe(true);
    });

    it('debe obtener el detalle de un colaborador por id', async () => {
      const pag = await firstValueFrom(api.listar());
      const primerId = pag.contenido[0].id;
      const detalle = await firstValueFrom(api.obtener(primerId));
      expect(detalle.id).toBe(primerId);
      expect(detalle.correo).toBeTruthy();
    });

    it('debe registrar un nuevo colaborador con grado y formatear nombreVisible', async () => {
      const nuevoForm: PersonalRegistroForm = {
        nombres: 'Elena Beatriz',
        apellidos: 'Vargas Silva',
        correo: `evargas_${Date.now()}@hospital.gob.pe`,
        idArea: 1,
        rol: 'USUARIO_FINAL',
        grado: GradoProfesional.LIC,
        generarContrasena: true,
      };

      const creado = await firstValueFrom(api.crear(nuevoForm));
      expect(creado.id).toBeGreaterThan(0);
      expect(creado.nombreVisible).toBe('Lic. Elena Vargas');
      expect(creado.contrasenaTemporal).toBeTruthy();
      expect(creado.debeCambiarContrasena).toBe(true);
    });

    it('debe restablecer la contraseña temporal de un colaborador', async () => {
      const pag = await firstValueFrom(api.listar());
      const colaborador = pag.contenido[0];
      const res = await firstValueFrom(api.restablecerContrasena(colaborador.id));
      expect(res.id).toBe(colaborador.id);
      expect(res.contrasenaTemporal).toBeTruthy();
      expect(res.contrasenaTemporal.length).toBeGreaterThanOrEqual(8);
    });

    it('debe alternar el estado activo de un colaborador', async () => {
      const pag = await firstValueFrom(api.listar());
      const colaborador = pag.contenido[0];
      const estadoOriginal = colaborador.activo;

      const modificado = await firstValueFrom(api.toggleActivo(colaborador.id));
      expect(modificado.activo).toBe(!estadoOriginal);

      // Restaurar
      await firstValueFrom(api.toggleActivo(colaborador.id));
    });
  });
}
