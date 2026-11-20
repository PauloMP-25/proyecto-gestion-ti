export const ETIQUETAS_TIPO: Record<string, string> = {
  COMPUTADORA: 'Computadora',
  IMPRESORA: 'Impresora',
  OTRO: 'Otro',
};

export const ETIQUETAS_ESTADO: Record<string, string> = {
  EN_SERVICIO: 'En servicio',
  EN_MANTENIMIENTO: 'En mantenimiento',
  DE_BAJA: 'De baja',
};

export function obtenerEtiquetaTipoEquipo(tipo: string | null | undefined): string {
  if (!tipo) return 'Equipo';
  return ETIQUETAS_TIPO[tipo] ?? tipo;
}

export function obtenerEtiquetaEstadoEquipo(estado: string | null | undefined): string {
  if (!estado) return '';
  return ETIQUETAS_ESTADO[estado] ?? estado;
}
