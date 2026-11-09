export enum PrioridadTicket {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export const PrioridadEtiquetas: Record<PrioridadTicket, string> = {
  [PrioridadTicket.P1]: 'P1 - Crítico',
  [PrioridadTicket.P2]: 'P2 - Alto',
  [PrioridadTicket.P3]: 'P3 - Medio',
  [PrioridadTicket.P4]: 'P4 - Bajo',
};
