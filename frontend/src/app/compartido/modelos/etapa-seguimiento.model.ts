import { EstadoTicket } from './estado-ticket.enum';

export type EtapaSeguimiento = 'REGISTRADO' | 'EN_ATENCION' | 'RESUELTO' | 'CERRADO';
export const ETAPAS_SEGUIMIENTO: readonly EtapaSeguimiento[] = ['REGISTRADO', 'EN_ATENCION', 'RESUELTO', 'CERRADO'];

/**
 * Proyecta los 7 estados técnicos internos del ciclo de vida a las 4 etapas
 * asistenciales entendibles por el personal del Hospital Santa María del Socorro.
 */
export function etapaDesdeEstado(e: EstadoTicket): EtapaSeguimiento {
  switch (e) {
    case EstadoTicket.NUEVO:
      return 'REGISTRADO';
    case EstadoTicket.ASIGNADO:
    case EstadoTicket.EN_PROCESO:
    case EstadoTicket.ESCALADO:
    case EstadoTicket.REABIERTO:
      return 'EN_ATENCION';
    case EstadoTicket.RESUELTO:
      return 'RESUELTO';
    case EstadoTicket.CERRADO:
      return 'CERRADO';
  }
}
