/**
 * Modelo de datos y utilidades para la Auditoría Inmutable y Trazabilidad Hospitalaria.
 * Cumple con skill-auditoria-historial-tickets y la regla de CERO términos ITIL en pantalla.
 */

export type TipoEventoAuditoria =
  | 'CREACION'
  | 'ASIGNACION'
  | 'REASIGNACION'
  | 'CAMBIO_ESTADO'
  | 'ESCALAMIENTO'
  | 'SOLUCION'
  | 'REAPERTURA'
  | 'CALIFICACION'
  | 'SLA_ALERTA'
  | 'SLA_INCUMPLIDO'
  | 'PRESTAMO';

export type VisibilidadAuditoria = 'PUBLICA' | 'INTERNA';

export type VarianteVisualAuditoria = 'info' | 'exito' | 'aviso' | 'peligro' | 'neutro';

export interface ItemAuditoria {
  id?: number | string;
  tipoEvento: TipoEventoAuditoria | string;
  fechaIso: string;
  usuarioNombre: string;
  usuarioRol?: string;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  datoAnterior?: string | null;
  datoNuevo?: string | null;
  comentario?: string | null;
  visibilidad?: VisibilidadAuditoria;
  ipOrigen?: string | null;
  tituloPersonalizado?: string;
  iconoPersonalizado?: string;
}

export interface ConfiguracionVisualEvento {
  titulo: string;
  icono: string;
  variante: VarianteVisualAuditoria;
}

/**
 * Diccionario de configuración visual en lenguaje institucional y hospitalario.
 * Ningún término ITIL visible.
 */
export const CONFIGURACION_EVENTO_AUDITORIA: Record<string, ConfiguracionVisualEvento> = {
  CREACION: {
    titulo: 'Solicitud Registrada',
    icono: 'edit_note',
    variante: 'info',
  },
  ASIGNACION: {
    titulo: 'Asignado a Personal Técnico',
    icono: 'person',
    variante: 'info',
  },
  REASIGNACION: {
    titulo: 'Reasignado a Otro Técnico',
    icono: 'sync_alt',
    variante: 'info',
  },
  CAMBIO_ESTADO: {
    titulo: 'Actualización de Estado',
    icono: 'timeline',
    variante: 'neutro',
  },
  ESCALAMIENTO: {
    titulo: 'Derivado a Soporte Nivel 2',
    icono: 'trending_up',
    variante: 'aviso',
  },
  SOLUCION: {
    titulo: 'Atención Concluida y Solución Registrada',
    icono: 'task_alt',
    variante: 'exito',
  },
  REAPERTURA: {
    titulo: 'Solicitud Reabierta por el Usuario',
    icono: 'refresh',
    variante: 'aviso',
  },
  CALIFICACION: {
    titulo: 'Conformidad y Calificación Recibida',
    icono: 'star',
    variante: 'exito',
  },
  SLA_ALERTA: {
    titulo: 'Alerta Preventiva de Compromiso de Atención',
    icono: 'warning',
    variante: 'aviso',
  },
  SLA_INCUMPLIDO: {
    titulo: 'Tiempo de Compromiso Excedido',
    icono: 'timer_off',
    variante: 'peligro',
  },
  PRESTAMO: {
    titulo: 'Equipo Asignado en Préstamo Temporal',
    icono: 'devices',
    variante: 'info',
  },
};

/**
 * Obtiene la configuración visual amigable para un evento.
 */
export function obtenerConfiguracionEvento(tipo: string): ConfiguracionVisualEvento {
  const norm = (tipo || '').toUpperCase().trim();
  return CONFIGURACION_EVENTO_AUDITORIA[norm] ?? {
    titulo: 'Evento Registrado',
    icono: 'history',
    variante: 'neutro',
  };
}

/**
 * Convierte un item de historial legado a un ItemAuditoria estandarizado.
 */
export function mapearHistorialEntradaAItemAuditoria(
  entrada: {
    fecha: string;
    usuario: string;
    estadoAnterior?: string | null;
    estadoNuevo?: string | null;
    comentario?: string;
  },
  indice: number
): ItemAuditoria {
  let tipoEvento: TipoEventoAuditoria = 'CAMBIO_ESTADO';
  if (indice === 0 && !entrada.estadoAnterior) {
    tipoEvento = 'CREACION';
  } else if (entrada.estadoNuevo === 'ASIGNADO' || entrada.estadoNuevo === 'EN_PROCESO') {
    tipoEvento = entrada.estadoAnterior === 'NUEVO' ? 'ASIGNACION' : 'CAMBIO_ESTADO';
  } else if (entrada.estadoNuevo === 'RESUELTO') {
    tipoEvento = 'SOLUCION';
  } else if (entrada.estadoNuevo === 'ESCALADO') {
    tipoEvento = 'ESCALAMIENTO';
  } else if (entrada.estadoNuevo === 'REABIERTO') {
    tipoEvento = 'REAPERTURA';
  } else if (entrada.estadoNuevo === 'CERRADO') {
    tipoEvento = 'CALIFICACION';
  }

  return {
    id: `legado-${indice}`,
    tipoEvento,
    fechaIso: entrada.fecha,
    usuarioNombre: entrada.usuario,
    estadoAnterior: entrada.estadoAnterior ?? null,
    estadoNuevo: entrada.estadoNuevo ?? null,
    comentario: entrada.comentario || null,
    visibilidad: 'PUBLICA',
  };
}
