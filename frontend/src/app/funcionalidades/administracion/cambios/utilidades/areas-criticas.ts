/** Áreas hospitalarias consideradas críticas para la evaluación de impacto. */
export const AREAS_CRITICAS: readonly string[] = [
  'Emergencia',
  'UCI Adultos',
  'UCI Neonatal',
  'Centro Quirúrgico',
  'Centro Obstétrico',
];

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function esAreaCritica(nombre: string): boolean {
  const buscado = normalizar(nombre);
  return AREAS_CRITICAS.some((area) => normalizar(area) === buscado);
}
