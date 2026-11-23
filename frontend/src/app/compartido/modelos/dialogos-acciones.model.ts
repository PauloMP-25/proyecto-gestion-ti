export interface ResolverTicketPayload {
  /** Diagnóstico de lo ocurrido (20–600 caracteres útiles) */
  diagnostico: string;
  /** Acciones realizadas para solucionar el problema (20–1200 caracteres útiles) */
  accionRealizada: string;
  /** Repuestos o insumos utilizados (opcional, máximo 200 caracteres útiles) */
  insumosUtilizados?: string;
  /** Tipo de solución aplicada */
  tipoSolucion: 'DEFINITIVA' | 'TEMPORAL';
  /** ID del artículo o guía de solución utilizada (opcional) */
  articuloConocimientoId?: number | null;
}

export interface EscalarTicketPayload {
  /** Motivo técnico de la derivación (20–300 caracteres útiles) */
  motivo: string;
  /** Diagnóstico o pruebas técnicas ya efectuadas por N1 (opcional, hasta 1000 caracteres) */
  detallesTecnicos?: string;
  /** Tipo de falla o especialidad Nivel 2 sugerida (opcional) */
  categoriaN2Id?: number | null;
}

export interface DatosDialogoResolver {
  ticketId: number;
  codigo: string;
  equipoEtiqueta?: string | null;
  articuloSugeridoId?: number | null;
}

export interface DatosDialogoEscalar {
  ticketId: number;
  codigo: string;
  titulo?: string;
}
