import { EstadoTicket } from '../modelos/estado-ticket.enum';
import { EtapaSeguimiento, etapaDesdeEstado } from '../modelos/etapa-seguimiento.model';
import { EstadoSla } from '../modelos/estado-sla.enum';
import { Rol } from '../../nucleo/modelos/rol.enum';

// ---- Términos prohibidos (usados por pruebas y por verificación) ----
export const TERMINOS_PROHIBIDOS_GLOBAL: readonly RegExp[] = [/\bITIL(\s?v?4)?\b/i];
export const TERMINOS_PROHIBIDOS_USUARIO_FINAL: readonly RegExp[] = [
  /\bSLA\b/, /\bCMDB\b/, /\bKEDB\b/, /\bRFC\b/, /\bworkaround\b/i,
  /\bincumplid[oa]\b/i, /\bvencid[oa]\b/i, /\bescalad[oa]\b/i, /\bP[1-4]\b/,
];

// ---- Etapas (usuario final) ----
export const ETIQUETA_ETAPA: Record<EtapaSeguimiento, string> = {
  REGISTRADO: 'Registrado',
  EN_ATENCION: 'En atención',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};

export const MENSAJE_ETAPA: Record<EtapaSeguimiento, string> = {
  REGISTRADO:  'Recibimos su solicitud. Un técnico la tomará en breve.',
  EN_ATENCION: 'Un técnico de TI está trabajando en su caso.',
  RESUELTO:    'Su solicitud fue atendida. Necesitamos su confirmación.',
  CERRADO:     'Solicitud cerrada. ¡Gracias por avisarnos!',
};

// ---- Estados por rol ----
const ESTADO_TECNICO: Record<EstadoTicket, string> = {
  NUEVO: 'Por tomar',
  ASIGNADO: 'Asignado',
  EN_PROCESO: 'En proceso',
  ESCALADO: 'Escalado',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
  REABIERTO: 'Reabierto',
};

export function etiquetaEstado(estado: EstadoTicket, rol: Rol): string {
  if (rol === Rol.USUARIO_FINAL) {
    return ETIQUETA_ETAPA[etapaDesdeEstado(estado)];
  }
  if (rol === Rol.ADMINISTRADOR && estado === EstadoTicket.NUEVO) {
    return 'Nuevo';
  }
  return ESTADO_TECNICO[estado] || estado;
}

// ---- Urgencia / prioridad ----
// Acepta P1, P2, P3, P4 o CRITICA, ALTA, MEDIA, BAJA o P1_CRITICA, etc.
const NIVEL: Record<string, 1 | 2 | 3 | 4> = {
  P1: 1, P2: 2, P3: 3, P4: 4,
  CRITICA: 1, P1_CRITICA: 1,
  ALTA: 2, P2_ALTA: 2,
  MEDIA: 3, P3_MEDIA: 3,
  BAJA: 4, P4_BAJA: 4,
};

export function nivelPrioridad(p: string): 1 | 2 | 3 | 4 {
  const n = NIVEL[p?.toUpperCase()];
  if (!n) {
    throw new Error(`Prioridad desconocida: ${p}`);
  }
  return n;
}

const ETIQUETA_URGENCIA: Record<1 | 2 | 3 | 4, string> = {
  1: 'Atención inmediata',
  2: 'Urgente',
  3: 'Normal',
  4: 'Programada',
};

export function etiquetaUrgencia(p: string, rol: Rol): string {
  const n = nivelPrioridad(p);
  return rol === Rol.USUARIO_FINAL ? ETIQUETA_URGENCIA[n] : `P${n} · ${ETIQUETA_URGENCIA[n]}`;
}

// ---- Compromiso de atención (Técnico) ----
export const ETIQUETA_SLA_TECNICO: Record<EstadoSla, string> = {
  A_TIEMPO: 'A tiempo',
  ALERTA: 'Por vencer',
  INCUMPLIDO: 'Vencido',
} as Record<EstadoSla, string>;

const fmtHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' });
const fmtDia  = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Lima' });
const fmtFecha = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', timeZone: 'America/Lima' });

/** Texto para el USUARIO_FINAL. Nunca dice "vencido". */
export function textoTiempoEstimado(limiteIso: string | null, ahoraMs: number): string {
  if (!limiteIso) return '';
  const limite = Date.parse(limiteIso);
  if (isNaN(limite)) return '';
  if (limite <= ahoraMs) return 'Estamos priorizando su caso.';
  const hora = fmtHora.format(limite);
  const mismoDia = fmtDia.format(limite) === fmtDia.format(ahoraMs);
  return mismoDia ? `Tiempo estimado de solución: hoy hasta las ${hora} hrs`
                  : `Tiempo estimado de solución: ${fmtFecha.format(limite)} hasta las ${hora} hrs`;
}

// ---- Mensajes comunes (lenguaje hospitalario asistencial) ----
export const MSG = {
  errorCarga:       'No pudimos cargar la información. Intente nuevamente.',
  errorGuardado:    'No pudimos guardar los cambios. Sus datos no se perdieron; intente nuevamente.',
  sinConexion:      'Sin conexión. Se muestran los últimos datos disponibles.',
  conflictoTomar:   'Otro técnico ya tomó este ticket.',
  noEncontrada:     'No encontramos esta solicitud.',
  sinSolicitudes:   'Aún no ha reportado problemas.',
  sinTickets:       'No tiene tickets en atención. ¡Buen trabajo!',
  avisoPacientes:   'No escriba nombres ni datos de pacientes.',
  gracias:          '¡Gracias por ayudarnos a mejorar!',
} as const;
