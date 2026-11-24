import { AccionCambio, EstadoCambio } from '../modelos/cambios.model';

const TRANSICIONES: Record<EstadoCambio, readonly AccionCambio[]> = {
  BORRADOR: ['ENVIAR_EVALUACION'],
  EN_EVALUACION: ['APROBAR', 'RECHAZAR', 'DEVOLVER_BORRADOR'],
  APROBADO: ['INICIAR_EJECUCION'],
  EN_EJECUCION: ['MARCAR_IMPLEMENTADO'],
  IMPLEMENTADO: [],
  RECHAZADO: [],
};

const DESTINO: Record<AccionCambio, EstadoCambio> = {
  ENVIAR_EVALUACION: 'EN_EVALUACION',
  APROBAR: 'APROBADO',
  RECHAZAR: 'RECHAZADO',
  DEVOLVER_BORRADOR: 'BORRADOR',
  INICIAR_EJECUCION: 'EN_EJECUCION',
  MARCAR_IMPLEMENTADO: 'IMPLEMENTADO',
};

/** Acciones que exigen escribir una observación. */
export const ACCIONES_CON_OBSERVACION: readonly AccionCambio[] = [
  'RECHAZAR',
  'DEVOLVER_BORRADOR',
  'MARCAR_IMPLEMENTADO',
];

export function accionesPermitidas(estado: EstadoCambio): readonly AccionCambio[] {
  return TRANSICIONES[estado];
}

export function estadoDestino(
  estado: EstadoCambio,
  accion: AccionCambio,
): EstadoCambio | null {
  return TRANSICIONES[estado].includes(accion) ? DESTINO[accion] : null;
}

export function esEditable(estado: EstadoCambio): boolean {
  return estado === 'BORRADOR';
}
