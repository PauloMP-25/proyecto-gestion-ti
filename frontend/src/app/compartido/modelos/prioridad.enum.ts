export enum PrioridadTicket {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export const PrioridadEtiquetas: Record<PrioridadTicket, string> = {
  [PrioridadTicket.P1]: 'P1 · Crítica',
  [PrioridadTicket.P2]: 'P2 · Alta',
  [PrioridadTicket.P3]: 'P3 · Media',
  [PrioridadTicket.P4]: 'P4 · Baja',
};
