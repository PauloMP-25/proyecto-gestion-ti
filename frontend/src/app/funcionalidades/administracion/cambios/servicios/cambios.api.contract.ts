import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { CambiosApi } from './cambios.api';
import { CambioFormulario } from '../modelos/cambios.model';

function formulario(parcial: Partial<CambioFormulario> = {}): CambioFormulario {
  return {
    titulo: 'Actualización de prueba del sistema de admisión',
    tipo: 'PROGRAMADO',
    categoria: 'SISTEMA_CLINICO',
    descripcion: 'Se actualizará el módulo de prueba del sistema de admisión.',
    justificacion: 'Es necesario para validar el flujo completo de solicitudes de cambio.',
    equiposAfectados: ['SRV-TEST-01'],
    idTicketOrigen: null,
    responsableEjecucion: 'Ing. de Pruebas',
    horario: {
      inicioIso: '2027-01-10T22:00:00-05:00',
      finIso: '2027-01-10T23:00:00-05:00',
    },
    evaluacion: {
      nivel: 'MEDIO',
      idsAreasAfectadas: [1, 6],
      requiereInterrupcion: false,
      minutosInterrupcion: null,
      serviciosAfectados: ['Registro de admisión'],
      pacientesPotencialmenteAfectados: null,
      descripcion: 'La actualización no interrumpe la atención.',
    },
    pasosImplementacion: [
      { descripcion: 'Respaldar la configuración actual.', responsable: 'Ing. de Pruebas', minutosEstimados: 10 },
      { descripcion: 'Aplicar la actualización.', responsable: 'Ing. de Pruebas', minutosEstimados: 30 },
    ],
    planReversa: {
      criterioActivacion: 'Si la actualización no concluye correctamente.',
      pasos: [
        { descripcion: 'Restaurar el respaldo previo.', responsable: 'Ing. de Pruebas', minutosEstimados: 20 },
      ],
      minutosEstimados: 20,
      planContinuidad: 'Admisión registra en el formato físico mientras se restablece el sistema.',
      responsableReversa: 'Ing. de Pruebas',
    },
    ...parcial,
  };
}

export function contratoCambiosApi(obtenerInstancia: () => CambiosApi): void {
  describe('Contrato unificado CambiosApi', () => {
    let api: CambiosApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('lista las solicitudes semilla cubriendo los 6 estados, 4 impactos y 3 tipos', async () => {
      const lista = await firstValueFrom(api.listar());

      expect(lista.length).toBeGreaterThanOrEqual(8);
      expect(new Set(lista.map((cambio) => cambio.estado)).size).toBe(6);
      expect(new Set(lista.map((cambio) => cambio.impacto)).size).toBe(4);
      expect(new Set(lista.map((cambio) => cambio.tipo)).size).toBe(3);
    });

    it('filtra por estado combinado con impacto', async () => {
      const lista = await firstValueFrom(api.listar({ estado: 'BORRADOR', impacto: 'ALTO' }));

      expect(lista.length).toBeGreaterThanOrEqual(1);
      expect(lista.every((cambio) => cambio.estado === 'BORRADOR')).toBe(true);
      expect(lista.every((cambio) => cambio.impacto === 'ALTO')).toBe(true);
    });

    it('filtra por texto ignorando mayúsculas y tildes', async () => {
      const conTilde = await firstValueFrom(api.listar({ texto: 'admisión' }));
      const sinTilde = await firstValueFrom(api.listar({ texto: 'ADMISION' }));

      expect(conTilde.length).toBeGreaterThan(0);
      expect(conTilde.map((cambio) => cambio.codigo)).toEqual(
        sinTilde.map((cambio) => cambio.codigo),
      );
    });

    it('obtiene el detalle de una solicitud existente', async () => {
      const lista = await firstValueFrom(api.listar());
      const primero = lista[0];
      const detalle = await firstValueFrom(api.obtener(primero.id));

      expect(detalle.id).toBe(primero.id);
      expect(detalle.codigo).toBe(primero.codigo);
      expect(detalle.historial.length).toBeGreaterThanOrEqual(1);
      expect(detalle.planReversa.pasos.length).toBeGreaterThanOrEqual(1);
    });

    it('devuelve 404 al solicitar una solicitud inexistente', async () => {
      await expect(firstValueFrom(api.obtener(9999))).rejects.toMatchObject({ status: 404 });
    });

    it('crea una solicitud en borrador con código correlativo e historial inicial', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));

      expect(creada.estado).toBe('BORRADOR');
      expect(creada.codigo).toMatch(/^SC-\d{4}-\d{4}$/);
      expect(creada.historial).toHaveLength(1);
      expect(creada.historial[0].estadoAnterior).toBeNull();
      expect(creada.historial[0].estadoNuevo).toBe('BORRADOR');
      expect(creada.areasAfectadas).toEqual(['Emergencia', 'Admisión Central']);
      expect(creada.pasosImplementacion.map((paso) => paso.orden)).toEqual([1, 2]);
    });

    it('actualiza una solicitud en borrador y rechaza con 409 si no lo es', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));
      const actualizada = await firstValueFrom(
        api.actualizar(creada.id, formulario({ titulo: 'Título actualizado del cambio' })),
      );

      expect(actualizada.titulo).toBe('Título actualizado del cambio');

      await expect(
        firstValueFrom(api.actualizar(1, formulario())),
      ).rejects.toMatchObject({ status: 409, error: { campo: 'estado' } });
    });

    it('transiciona por el flujo válido y agrega eventos al historial', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));
      const enEvaluacion = await firstValueFrom(
        api.transicionar(creada.id, { accion: 'ENVIAR_EVALUACION', observacion: null }),
      );

      expect(enEvaluacion.estado).toBe('EN_EVALUACION');
      expect(enEvaluacion.historial).toHaveLength(2);

      const rechazada = await firstValueFrom(
        api.transicionar(creada.id, {
          accion: 'RECHAZAR',
          observacion: 'Falta detallar el impacto en Farmacia.',
        }),
      );

      expect(rechazada.estado).toBe('RECHAZADO');
      expect(rechazada.observacionDecision).toBe('Falta detallar el impacto en Farmacia.');
      expect(rechazada.historial).toHaveLength(3);
    });

    it('rechaza transiciones inválidas con 409', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));

      await expect(
        firstValueFrom(api.transicionar(creada.id, { accion: 'APROBAR', observacion: null })),
      ).rejects.toMatchObject({ status: 409, error: { campo: 'accion' } });
    });

    it('exige observación en las acciones que la requieren', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));
      await firstValueFrom(
        api.transicionar(creada.id, { accion: 'ENVIAR_EVALUACION', observacion: null }),
      );

      await expect(
        firstValueFrom(api.transicionar(creada.id, { accion: 'RECHAZAR', observacion: '  ' })),
      ).rejects.toMatchObject({ status: 409, error: { campo: 'observacion' } });
    });

    it('elimina solo solicitudes en borrador', async () => {
      const creada = await firstValueFrom(api.crear(formulario()));
      await firstValueFrom(api.eliminar(creada.id));

      const lista = await firstValueFrom(api.listar());
      expect(lista.some((cambio) => cambio.id === creada.id)).toBe(false);

      await expect(firstValueFrom(api.eliminar(1))).rejects.toMatchObject({
        status: 409,
        error: { campo: 'estado' },
      });
      await expect(firstValueFrom(api.eliminar(9999))).rejects.toMatchObject({ status: 404 });
    });

    it('lista las áreas seleccionables marcando las críticas', async () => {
      const areas = await firstValueFrom(api.listarAreasSeleccionables());

      expect(areas.length).toBeGreaterThanOrEqual(10);
      expect(areas.find((area) => area.nombre === 'Emergencia')?.esCritica).toBe(true);
      expect(areas.find((area) => area.nombre === 'Pediatría')?.esCritica).toBe(false);
    });
  });
}
