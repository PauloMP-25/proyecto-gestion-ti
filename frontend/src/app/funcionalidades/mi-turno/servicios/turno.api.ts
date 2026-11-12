import { Observable } from 'rxjs';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import {
  TicketTurno,
  ResumenTurno,
  ConsultaTurno,
  TomarTicketPayload,
} from '../modelos/ticket-turno.model';
import {
  ResolverTicketPayload,
  EscalarTicketPayload,
} from '../../../compartido/modelos/dialogos-acciones.model';

export abstract class TurnoApi {
  /** Obtiene contadores y alertas resumidas del turno del técnico */
  abstract resumen(): Observable<ResumenTurno>;

  /** Lista los tickets filtrados y ordenados por pestaña y criterios */
  abstract listar(c: ConsultaTurno): Observable<Pagina<TicketTurno>>;

  /** Obtiene el detalle completo de un ticket en turno */
  abstract obtener(id: number): Observable<TicketTurno>;

  /**
   * Toma un ticket de la bolsa de tickets nuevos asignándolo a sí mismo.
   * Si iniciarAtencion es true, pasa directo a EN_PROCESO.
   * Lanza 409 si otro técnico ya tomó el ticket.
   */
  abstract tomar(id: number, p: TomarTicketPayload): Observable<TicketTurno>;

  /** Pasa un ticket asignado o reabierto a EN_PROCESO, registrando primera respuesta */
  abstract iniciarAtencion(id: number): Observable<TicketTurno>;

  /** Marca el ticket como RESUELTO guardando diagnóstico y acciones */
  abstract resolver(id: number, p: ResolverTicketPayload): Observable<TicketTurno>;

  /** Escala el ticket a Nivel 2 con motivo técnico documentado */
  abstract escalar(id: number, p: EscalarTicketPayload): Observable<TicketTurno>;
}
