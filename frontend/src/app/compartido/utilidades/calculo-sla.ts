import { EstadoTicket } from '../modelos/estado-ticket.enum';
import { EstadoSla } from '../modelos/estado-sla.enum';
import { FaseSla, SlaTicketVista, SlaCalculado } from '../modelos/sla-vista.model';

export const UMBRAL_ALERTA = 0.20; // Ámbar cuando queda <= 20% del tiempo total
const MIN = 60_000;

/**
 * Determina la fase actual del SLA según el estado del ticket y si ya se registró
 * la primera respuesta técnica.
 */
export function faseDesdeEstado(estado: EstadoTicket, respuestaRealIso: string | null = null): FaseSla {
  if (
    estado === EstadoTicket.ESCALADO ||
    estado === EstadoTicket.RESUELTO ||
    estado === EstadoTicket.CERRADO
  ) {
    return 'COMPLETADO';
  }
  if (estado === EstadoTicket.EN_PROCESO || respuestaRealIso != null) {
    return 'RESOLUCION';
  }
  return 'RESPUESTA';
}

/**
 * Función pura que calcula la cuenta regresiva, porcentaje y estado semafórico del SLA.
 */
export function calcularSla(v: SlaTicketVista, ahoraClienteMs: number): SlaCalculado {
  if (v.fase === 'COMPLETADO') {
    return {
      fase: 'COMPLETADO',
      restanteMs: 0,
      porcentajeRestante: 1,
      estado: EstadoSla.A_TIEMPO,
      texto: ''
    };
  }

  const ahora = ahoraClienteMs + (v.desfaseServidorMs || 0);
  const inicio = Date.parse(v.inicioIso);
  const limite = Date.parse(v.fase === 'RESPUESTA' ? v.limiteRespuestaIso : v.limiteResolucionIso);
  const total = Math.max(limite - inicio, 1); // Evita división por 0
  const restanteMs = limite - ahora;
  const porcentajeRestante = Math.min(Math.max(restanteMs / total, 0), 1);

  const estado =
    restanteMs <= 0 ? EstadoSla.INCUMPLIDO :
    porcentajeRestante <= UMBRAL_ALERTA ? EstadoSla.ALERTA :
    EstadoSla.A_TIEMPO;

  return {
    fase: v.fase,
    restanteMs,
    porcentajeRestante,
    estado,
    texto: formatearRestante(restanteMs)
  };
}

/**
 * Calcula el desfase en milisegundos entre el reloj del servidor y el reloj del cliente.
 */
export function calcularDesfase(ahoraServidorIso: string, recibidoClienteMs = Date.now()): number {
  return Date.parse(ahoraServidorIso) - recibidoClienteMs;
}

/**
 * Formatea el tiempo restante para cronómetros técnicos.
 * >= 1 h -> "2 h 15 min"
 * < 1 h y >= 10 min -> "45 min"
 * < 10 min -> "09:59" (actualización por segundo)
 * Vencido -> "Vencido hace 15 min" / "Vencido hace menos de 1 min"
 */
export function formatearRestante(ms: number): string {
  if (ms > 0) {
    if (ms < 10 * MIN) {
      const s = Math.floor(ms / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    return formatearDuracion(Math.ceil(ms / MIN));
  }
  const vencidoMin = Math.floor(-ms / MIN);
  return vencidoMin < 1 ? 'Vencido hace menos de 1 min' : `Vencido hace ${formatearDuracion(vencidoMin)}`;
}

function formatearDuracion(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
