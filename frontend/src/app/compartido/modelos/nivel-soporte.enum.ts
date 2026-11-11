export enum NivelSoporte {
  N1 = 'N1',
  N2 = 'N2',
}

export const NivelSoporteEtiquetas: Record<NivelSoporte, string> = {
  [NivelSoporte.N1]: 'Soporte operativo',
  [NivelSoporte.N2]: 'Especialista TI',
};