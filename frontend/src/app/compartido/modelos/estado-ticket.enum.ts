export enum EstadoTicket {
  NUEVO = 'NUEVO',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO',
}

export const EstadoTicketEtiquetas: Record<EstadoTicket, string> = {
  [EstadoTicket.NUEVO]: 'Nuevo',
  [EstadoTicket.ASIGNADO]: 'Asignado',
  [EstadoTicket.EN_PROCESO]: 'En Proceso',
  [EstadoTicket.RESUELTO]: 'Resuelto',
  [EstadoTicket.CERRADO]: 'Cerrado',
};
