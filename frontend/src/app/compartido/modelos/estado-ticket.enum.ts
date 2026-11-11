export enum EstadoTicket {
  NUEVO = 'NUEVO',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  ESCALADO = 'ESCALADO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO',
  REABIERTO = 'REABIERTO',
}

export const EstadoTicketEtiquetas: Record<EstadoTicket, string> = {
  [EstadoTicket.NUEVO]: 'Nuevo',
  [EstadoTicket.ASIGNADO]: 'Asignado',
  [EstadoTicket.EN_PROCESO]: 'En atención',
  [EstadoTicket.ESCALADO]: 'Derivado a especialista',
  [EstadoTicket.RESUELTO]: 'Resuelto',
  [EstadoTicket.CERRADO]: 'Cerrado',
  [EstadoTicket.REABIERTO]: 'Reabierto',
};
