export enum EstadoSLA {
  A_TIEMPO = 'A_TIEMPO',
  ALERTA = 'ALERTA',
  INCUMPLIDO = 'INCUMPLIDO',
}

export const EstadoSLAEtiquetas: Record<EstadoSLA, string> = {
  [EstadoSLA.A_TIEMPO]: 'A tiempo',
  [EstadoSLA.ALERTA]: 'Próximo a vencer',
  [EstadoSLA.INCUMPLIDO]: 'Incumplido',
};
