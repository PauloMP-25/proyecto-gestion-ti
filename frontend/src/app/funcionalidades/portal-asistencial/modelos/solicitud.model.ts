import { EtapaSeguimiento } from '../../../compartido/modelos/etapa-seguimiento.model';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { ContextoEquipo } from '../../../compartido/modelos/contexto-equipo.model';

export interface SolicitudResumen {
  id: number;
  codigo: string;
  titulo: string;
  categoriaNombre: string;
  areaNombre: string;
  etapa: EtapaSeguimiento;
  urgencia: Prioridad;
  fechaCreacionIso: string;
  fechaUltimaNovedadIso: string;
  requiereConfirmacion: boolean;
  calificada: boolean;
}

export interface HitoSeguimiento {
  id: number;
  etapa: EtapaSeguimiento;
  mensaje: string;
  fechaIso: string;
}

export interface CalificacionAtencion {
  puntuacion: 1 | 2 | 3 | 4 | 5;
  comentario: string | null;
  fechaIso: string;
}

export interface SolicitudDetalle extends SolicitudResumen {
  descripcion: string;
  tecnicoVisible: string | null;
  tiempoEstimadoSolucionIso: string | null;
  reabierta: boolean;
  equipo: ContextoEquipo | null;
  hitos: HitoSeguimiento[];
  calificacion: CalificacionAtencion | null;
}

export interface CalificarPayload {
  puntuacion: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
}

export interface ReabrirPayload {
  motivo: string;
}

export type FiltroSolicitudes = 'TODAS' | 'EN_CURSO' | 'POR_CONFIRMAR' | 'CERRADAS';

export interface ConsultaSolicitudes {
  filtro: FiltroSolicitudes;
  texto?: string;
  pagina: number;
  tamano: number;
}
