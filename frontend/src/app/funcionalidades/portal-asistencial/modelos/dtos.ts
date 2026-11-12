import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { etapaDesdeEstado } from '../../../compartido/modelos/etapa-seguimiento.model';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { ContextoEquipo } from '../../../compartido/modelos/contexto-equipo.model';
import {
  SolicitudResumen,
  SolicitudDetalle,
  HitoSeguimiento,
  CalificacionAtencion,
} from './solicitud.model';

export interface SolicitudDto {
  id: number;
  codigo: string;
  titulo: string;
  descripcion?: string;
  categoria?: { id: number; nombre: string };
  categoriaNombre?: string;
  area?: { id: number; nombre: string };
  areaNombre?: string;
  estado: EstadoTicket | string;
  prioridad: Prioridad | string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  fechaUltimaNovedad?: string;
  tecnicoAsignado?: { id: number; nombre: string } | null;
  tecnicoVisible?: string | null;
  fechaLimiteResolucion?: string | null;
  reabierto?: boolean;
  equipo?: ContextoEquipo | null;
  hitos?: Array<{
    id: number;
    etapa?: string;
    estado?: string;
    mensaje: string;
    fecha: string;
  }>;
  calificacion?: {
    puntuacion: number;
    comentario?: string | null;
    fecha: string;
  } | null;
}

export function mapearSolicitudResumen(dto: SolicitudDto): SolicitudResumen {
  const estadoEnum = (dto.estado as EstadoTicket) || EstadoTicket.NUEVO;
  const etapa = etapaDesdeEstado(estadoEnum);
  const prioridadEnum = (dto.prioridad as Prioridad) || Prioridad.P3_MEDIA;

  return {
    id: dto.id,
    codigo: dto.codigo,
    titulo: dto.titulo,
    categoriaNombre: dto.categoria?.nombre || dto.categoriaNombre || 'Soporte General',
    areaNombre: dto.area?.nombre || dto.areaNombre || 'Hospital Santa María del Socorro',
    etapa,
    urgencia: prioridadEnum,
    fechaCreacionIso: dto.fechaCreacion,
    fechaUltimaNovedadIso: dto.fechaUltimaNovedad || dto.fechaActualizacion || dto.fechaCreacion,
    requiereConfirmacion: etapa === 'RESUELTO',
    calificada: Boolean(dto.calificacion),
  };
}

export function mapearSolicitudDetalle(dto: SolicitudDto): SolicitudDetalle {
  const resumen = mapearSolicitudResumen(dto);

  const hitos: HitoSeguimiento[] = (dto.hitos || []).map((h, i) => {
    const estado = (h.estado as EstadoTicket) || EstadoTicket.NUEVO;
    return {
      id: h.id || i + 1,
      etapa: (h.etapa as any) || etapaDesdeEstado(estado),
      mensaje: h.mensaje,
      fechaIso: h.fecha,
    };
  });

  let calificacion: CalificacionAtencion | null = null;
  if (dto.calificacion) {
    calificacion = {
      puntuacion: Math.min(5, Math.max(1, dto.calificacion.puntuacion)) as 1 | 2 | 3 | 4 | 5,
      comentario: dto.calificacion.comentario ?? null,
      fechaIso: dto.calificacion.fecha,
    };
  }

  return {
    ...resumen,
    descripcion: dto.descripcion || '',
    tecnicoVisible: dto.tecnicoVisible || (dto.tecnicoAsignado ? dto.tecnicoAsignado.nombre : null),
    tiempoEstimadoSolucionIso: dto.fechaLimiteResolucion ?? null,
    reabierta: Boolean(dto.reabierto),
    equipo: dto.equipo ?? null,
    hitos,
    calificacion,
  };
}
