import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';

export type TipoTicket = 'incidente' | 'solicitud';
export type NivelImpacto = 'ALTO' | 'MEDIO' | 'BAJO';
export type NivelUrgencia = 'ALTA' | 'MEDIA' | 'BAJA';

export interface ContextoEquipoDetectado {
  ip: string;
  hostname: string;
  area: string;
  anexo: string;
  detectadoAutomatico: boolean;
  activoCMDBId?: string;
}

export interface CategoriaTicket {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  ejemplos: string[];
}

export interface EstimacionSLA {
  prioridad: PrioridadTicket;
  prioridadNombre: string;
  colorClase: string;
  tiempoRespuestaMin: number;
  tiempoResolucionMin: number;
  textoRespuesta: string;
  textoResolucion: string;
}

export interface NuevaSolicitudPayload {
  tipo: TipoTicket;
  categoriaId: string;
  titulo: string;
  descripcion: string;
  impacto: NivelImpacto;
  urgencia: NivelUrgencia;
  contextoEquipo: ContextoEquipoDetectado;
}

export interface SolicitudRegistradaRespuesta {
  id: string;
  codigo: string;
  titulo: string;
  tipo: TipoTicket;
  prioridad: PrioridadTicket;
  estado: string;
  fechaCreacion: Date;
  slaEstimado: EstimacionSLA;
  contextoEquipo: ContextoEquipoDetectado;
}
