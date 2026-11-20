/**
 * Catálogo enum tipado para grados y títulos profesionales del personal de salud.
 * Garantiza consistencia estricta entre el backend y frontend sin almacenar datos sensibles.
 */
export enum GradoProfesional {
  LIC = 'LIC',
  TEC = 'TEC',
  DR = 'DR',
  DRA = 'DRA',
  MG = 'MG',
  ING = 'ING',
  SIN_GRADO = 'SIN_GRADO',
}

export interface OpcionGrado {
  readonly codigo: GradoProfesional;
  readonly etiqueta: string;          // 'Lic.' | … | 'Sin grado'
  readonly prefijo: string | null;    // null para SIN_GRADO
  readonly orden: number;
}

/** Respaldo estático institucional utilizado durante la vista previa si el catálogo dinámico aún no ha respondido. */
export const GRADOS_PROFESIONALES: readonly OpcionGrado[] = [
  { codigo: GradoProfesional.LIC,       etiqueta: 'Lic.',      prefijo: 'Lic.', orden: 1 },
  { codigo: GradoProfesional.TEC,       etiqueta: 'Téc.',      prefijo: 'Téc.', orden: 2 },
  { codigo: GradoProfesional.DR,        etiqueta: 'Dr.',       prefijo: 'Dr.',  orden: 3 },
  { codigo: GradoProfesional.DRA,       etiqueta: 'Dra.',      prefijo: 'Dra.', orden: 4 },
  { codigo: GradoProfesional.MG,        etiqueta: 'Mg.',       prefijo: 'Mg.',  orden: 5 },
  { codigo: GradoProfesional.ING,       etiqueta: 'Ing.',      prefijo: 'Ing.', orden: 6 },
  { codigo: GradoProfesional.SIN_GRADO, etiqueta: 'Sin grado', prefijo: null,   orden: 7 },
];

/**
 * Función pura institucional:
 * "Lic." + "Patricia Elena" + "Ramos Quispe" → "Lic. Patricia Ramos"
 */
export function nombreVisible(
  grado: GradoProfesional | string | null | undefined,
  nombres: string | null | undefined,
  apellidos: string | null | undefined
): string {
  const primerNombre = (nombres || '').trim().split(/\s+/)[0] || '';
  const primerApellido = (apellidos || '').trim().split(/\s+/)[0] || '';
  const base = `${primerNombre} ${primerApellido}`.trim();
  if (!base) return '';

  const opcion = GRADOS_PROFESIONALES.find(g => g.codigo === grado);
  const prefijo = opcion?.prefijo;
  return prefijo ? `${prefijo} ${base}` : base;
}
