import { Observable } from 'rxjs';
import { ContextoAtencion, ReportarProblemaSolicitud } from '../modelos/contexto-atencion.model';
import { Ticket } from '../../../compartido/modelos/ticket.model';

export abstract class ContextoAtencionApi {
  /**
   * Obtiene la resolución del contexto asistencial del usuario según su IP de origen.
   */
  abstract obtenerContexto(): Observable<ContextoAtencion>;

  /**
   * Registra un nuevo reporte de problema asistencial enviando el contexto capturado.
   */
  abstract reportarProblema(solicitud: ReportarProblemaSolicitud): Observable<Ticket>;
}
