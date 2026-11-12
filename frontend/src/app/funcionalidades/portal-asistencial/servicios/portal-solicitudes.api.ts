import { Observable } from 'rxjs';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import {
  SolicitudResumen,
  SolicitudDetalle,
  ConsultaSolicitudes,
  CalificarPayload,
  CalificacionAtencion,
  ReabrirPayload,
} from '../modelos/solicitud.model';

export abstract class PortalSolicitudesApi {
  /**
   * Obtiene la lista paginada y filtrada de solicitudes del usuario asistencial.
   */
  abstract listar(c: ConsultaSolicitudes): Observable<Pagina<SolicitudResumen>>;

  /**
   * Obtiene el detalle completo de una solicitud por su identificador.
   */
  abstract obtenerDetalle(id: number): Observable<SolicitudDetalle>;

  /**
   * Cuenta cuántas solicitudes están en etapa RESUELTO esperando confirmación del usuario.
   */
  abstract contarPorConfirmar(): Observable<number>;

  /**
   * El usuario confirma que la solución funcionó (RESUELTO -> CERRADO).
   */
  abstract confirmarSolucion(id: number): Observable<void>;

  /**
   * El usuario indica que la falla persiste y reabre la solicitud (RESUELTO -> REABIERTO).
   */
  abstract reabrir(id: number, p: ReabrirPayload): Observable<void>;

  /**
   * El usuario califica el servicio de atención recibido para una solicitud cerrada.
   */
  abstract calificar(id: number, p: CalificarPayload): Observable<CalificacionAtencion>;
}
