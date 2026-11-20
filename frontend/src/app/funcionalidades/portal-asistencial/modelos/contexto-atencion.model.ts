import { Impacto, TipoTicket, Urgencia } from '../../../compartido/modelos/impacto-urgencia.enum';
import { TipoActivo } from '../../cmdb/modelos/tipo-activo.enum';

export type EstadoDeteccion = 'DETECTADO' | 'IP_SIN_EQUIPO' | 'IP_NO_REGISTRADA';

export type ObjetivoFalla = 'EQUIPO_ACTUAL' | 'IMPRESORA_AREA' | 'OTRO';

export interface EquipoContexto {
  readonly id: number;
  readonly codigoInventario: string;
  readonly nombre: string;
  readonly tipo: TipoActivo | string;
  readonly referenciaUbicacion?: string | null;
}

export interface AreaContexto {
  readonly id: number;
  readonly nombre: string;
  readonly ubicacionLegible?: string | null;
  readonly referenciaUbicacion?: string | null;
  readonly anexo?: string | null;
  readonly encargado?: {
    readonly id: number;
    readonly nombreVisible: string;
  } | null;
}

export interface ImpresoraArea {
  readonly id: number;
  readonly codigoInventario: string;
  readonly nombre: string;
  readonly referenciaUbicacion?: string | null;
  readonly ipEstatica?: string | null;
}

export interface PersonaContexto {
  readonly id: number;
  readonly nombreVisible: string;
  readonly grado?: string | null;
  readonly areaAdscrita?: {
    readonly id: number;
    readonly nombre: string;
  } | null;
}

export interface ContextoAtencion {
  readonly estadoDeteccion: EstadoDeteccion;
  readonly ipOrigen: string;
  readonly equipo?: EquipoContexto | null;
  readonly area?: AreaContexto | null;
  readonly impresorasArea: readonly ImpresoraArea[];
  readonly persona?: PersonaContexto | null;
  readonly personaEnOtraArea: boolean;
}

export interface ReportarProblemaSolicitud {
  readonly tipo: TipoTicket;
  readonly asunto: string;
  readonly descripcion: string;
  readonly impacto: Impacto;
  readonly urgencia: Urgencia;
  readonly objetivo: ObjetivoFalla;
  readonly idImpresora?: number | null;
  readonly idAreaManual?: number | null;
}
