import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';
import { ContextoEquipo } from '../../../compartido/modelos/contexto-equipo.model';
import { SlaTicketVista } from '../../../compartido/modelos/sla-vista.model';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { calcularSla } from '../../../compartido/utilidades/calculo-sla';
import { Rol, RolUsuario } from '../../../nucleo/modelos/rol.enum';

export type VistaTurno = 'POR_TOMAR' | 'EN_ATENCION' | 'HISTORIAL';

export interface TecnicoAsignado {
  id: number;
  nombre: string;
}

export interface TicketTurno {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoTicket;
  nivelSoporte: NivelSoporte;
  categoriaId: number;
  categoriaNombre: string;
  areaNombre: string;
  solicitanteNombre: string;
  anexo: string | null;
  equipo: ContextoEquipo | null;
  asignadoA: TecnicoAsignado | null;
  esMio: boolean;
  reabierto: boolean;
  fechaCreacionIso: string;
  sla: SlaTicketVista;
}

export interface ResumenTurno {
  asignados: number;
  porVencer: number;
  vencidos: number;
  resueltosHoy: number;
  hayP1SinTomar: boolean;
  ahoraServidorIso: string;
}

export interface ConsultaTurno {
  vista: VistaTurno;
  texto?: string;
  soloP1P2?: boolean;
  pagina: number;
  tamano: number;
}

export interface TomarTicketPayload {
  iniciarAtencion: boolean;
}

export type AccionTurno = 'TOMAR' | 'TOMAR_Y_COMENZAR' | 'INICIAR' | 'RESOLVER' | 'ESCALAR';

export interface AccionesTicketResultado {
  primaria: AccionTurno | null;
  secundarias: AccionTurno[];
}

/**
 * Determina qué acciones están disponibles para un ticket en la vista de Mi Turno.
 * Respeta la matriz de acciones definida en §2.3:
 * - Solo aplicable para el rol PRACTICANTE (el Administrador tiene su propio módulo y no escala a N2).
 * - NUEVO sin asignar: 'TOMAR' o 'TOMAR_Y_COMENZAR' (si es P1 o P2).
 * - ASIGNADO / REABIERTO propio: 'INICIAR' (primaria), 'ESCALAR' (secundaria).
 * - EN_PROCESO propio: 'RESOLVER' (primaria), 'ESCALAR' (secundaria).
 * - Otros estados o asignado a otro técnico: solo lectura (sin acciones).
 */
export function accionesDisponibles(ticket: TicketTurno, rol: Rol): AccionesTicketResultado {
  if (rol !== RolUsuario.PRACTICANTE) {
    return { primaria: null, secundarias: [] };
  }

  // 1. Ticket nuevo en la bolsa común
  if (ticket.estado === EstadoTicket.NUEVO && (!ticket.asignadoA || !ticket.asignadoA.id)) {
    const esUrgente = ticket.prioridad === Prioridad.P1_CRITICA || ticket.prioridad === Prioridad.P2_ALTA;
    return {
      primaria: esUrgente ? 'TOMAR_Y_COMENZAR' : 'TOMAR',
      secundarias: [],
    };
  }

  // 2. Ticket asignado o reabierto perteneciente al técnico actual
  if (ticket.esMio && (ticket.estado === EstadoTicket.ASIGNADO || ticket.estado === EstadoTicket.REABIERTO)) {
    return {
      primaria: 'INICIAR',
      secundarias: ['ESCALAR'],
    };
  }

  // 3. Ticket en atención activa por el técnico actual
  if (ticket.esMio && ticket.estado === EstadoTicket.EN_PROCESO) {
    return {
      primaria: 'RESOLVER',
      secundarias: ['ESCALAR'],
    };
  }

  // 4. Estados terminales o pertenecientes a otro técnico
  return { primaria: null, secundarias: [] };
}

/**
 * Peso numérico de prioridad para ordenación (menor número = mayor urgencia).
 */
export function pesoPrioridad(prioridad: Prioridad): number {
  switch (prioridad) {
    case Prioridad.P1_CRITICA:
      return 1;
    case Prioridad.P2_ALTA:
      return 2;
    case Prioridad.P3_MEDIA:
      return 3;
    case Prioridad.P4_BAJA:
      return 4;
    default:
      return 99;
  }
}

/**
 * Peso de estado de SLA (menor número = mayor urgencia/atención requerida).
 * INCUMPLIDO (vencido) > ALERTA (por vencer) > A_TIEMPO > COMPLETADO.
 */
export function pesoEstadoSla(estado: EstadoSla): number {
  switch (estado) {
    case EstadoSla.INCUMPLIDO:
      return 1;
    case EstadoSla.ALERTA:
      return 2;
    case EstadoSla.A_TIEMPO:
      return 3;
    default:
      return 4;
  }
}

/**
 * Comparador puro para la ordenación estricta de la bandeja de Mi Turno:
 * 1. En vista 'POR_TOMAR': prioridad (P1 > P2 > P3 > P4) y luego mayor antigüedad.
 * 2. En vista 'EN_ATENCION':
 *    a) Semáforo SLA: INCUMPLIDO (vencido) > ALERTA (por vencer) > A_TIEMPO
 *    b) Prioridad: P1 > P2 > P3 > P4
 *    c) Menor tiempo restante de SLA (milisegundos)
 */
export function compararUrgenciaTurno(
  a: TicketTurno,
  b: TicketTurno,
  ahoraClienteMs: number,
  vista: VistaTurno = 'EN_ATENCION'
): number {
  if (vista === 'POR_TOMAR') {
    const diffPrio = pesoPrioridad(a.prioridad) - pesoPrioridad(b.prioridad);
    if (diffPrio !== 0) return diffPrio;
    return Date.parse(a.fechaCreacionIso) - Date.parse(b.fechaCreacionIso);
  }

  // En atención
  const slaA = calcularSla(a.sla, ahoraClienteMs);
  const slaB = calcularSla(b.sla, ahoraClienteMs);

  const pesoSlaA = pesoEstadoSla(slaA.estado);
  const pesoSlaB = pesoEstadoSla(slaB.estado);

  if (pesoSlaA !== pesoSlaB) {
    return pesoSlaA - pesoSlaB;
  }

  const diffPrio = pesoPrioridad(a.prioridad) - pesoPrioridad(b.prioridad);
  if (diffPrio !== 0) return diffPrio;

  return slaA.restanteMs - slaB.restanteMs;
}
