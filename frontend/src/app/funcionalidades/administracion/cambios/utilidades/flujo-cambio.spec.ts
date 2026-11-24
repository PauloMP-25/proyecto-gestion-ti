import {
  ACCIONES_CON_OBSERVACION,
  accionesPermitidas,
  esEditable,
  estadoDestino,
} from './flujo-cambio';
import { AccionCambio, ESTADOS_CAMBIO } from '../modelos/cambios.model';

describe('flujo-cambio', () => {
  it('define las acciones permitidas de cada estado', () => {
    expect(accionesPermitidas('BORRADOR')).toEqual(['ENVIAR_EVALUACION']);
    expect(accionesPermitidas('EN_EVALUACION')).toEqual([
      'APROBAR',
      'RECHAZAR',
      'DEVOLVER_BORRADOR',
    ]);
    expect(accionesPermitidas('APROBADO')).toEqual(['INICIAR_EJECUCION']);
    expect(accionesPermitidas('EN_EJECUCION')).toEqual(['MARCAR_IMPLEMENTADO']);
    expect(accionesPermitidas('IMPLEMENTADO')).toEqual([]);
    expect(accionesPermitidas('RECHAZADO')).toEqual([]);
  });

  it('calcula el estado destino de las transiciones válidas', () => {
    expect(estadoDestino('BORRADOR', 'ENVIAR_EVALUACION')).toBe('EN_EVALUACION');
    expect(estadoDestino('EN_EVALUACION', 'APROBAR')).toBe('APROBADO');
    expect(estadoDestino('EN_EVALUACION', 'RECHAZAR')).toBe('RECHAZADO');
    expect(estadoDestino('EN_EVALUACION', 'DEVOLVER_BORRADOR')).toBe('BORRADOR');
    expect(estadoDestino('APROBADO', 'INICIAR_EJECUCION')).toBe('EN_EJECUCION');
    expect(estadoDestino('EN_EJECUCION', 'MARCAR_IMPLEMENTADO')).toBe('IMPLEMENTADO');
  });

  it('devuelve null en transiciones inválidas', () => {
    expect(estadoDestino('BORRADOR', 'APROBAR')).toBeNull();
    expect(estadoDestino('APROBADO', 'RECHAZAR')).toBeNull();
    expect(estadoDestino('IMPLEMENTADO', 'INICIAR_EJECUCION')).toBeNull();
    expect(estadoDestino('RECHAZADO', 'DEVOLVER_BORRADOR')).toBeNull();
  });

  it('solo permite editar solicitudes en borrador', () => {
    for (const estado of ESTADOS_CAMBIO) {
      expect(esEditable(estado)).toBe(estado === 'BORRADOR');
    }
  });

  it('exige observación en rechazo, correcciones y resultado', () => {
    const esperadas: AccionCambio[] = ['RECHAZAR', 'DEVOLVER_BORRADOR', 'MARCAR_IMPLEMENTADO'];
    expect([...ACCIONES_CON_OBSERVACION]).toEqual(esperadas);
  });
});
