import {
  AccionCambio,
  CategoriaCambio,
  EstadoCambio,
  ImpactoAsistencial,
  TipoCambio,
} from '../modelos/cambios.model';

export interface AreaAfectadaDto {
  readonly idArea: number;
  readonly nombre: string;
  readonly esCritica?: boolean | null;
}

export interface AreaSeleccionableDto {
  readonly id?: number;
  readonly idArea?: number;
  readonly nombre: string;
  readonly esCritica?: boolean | null;
}

export interface PasoPlanDto {
  readonly orden?: number | null;
  readonly descripcion: string;
  readonly responsable?: string | null;
  readonly minutosEstimados?: number | null;
}

export interface HorarioProgramadoDto {
  readonly inicioIso?: string | null;
  readonly inicio?: string | null;
  readonly fechaInicio?: string | null;
  readonly finIso?: string | null;
  readonly fin?: string | null;
  readonly fechaFin?: string | null;
}

export interface EvaluacionImpactoDto {
  readonly nivel?: ImpactoAsistencial | null;
  readonly areasAfectadas?: readonly (AreaAfectadaDto | string)[] | null;
  readonly requiereInterrupcion?: boolean | null;
  readonly minutosInterrupcion?: number | null;
  readonly serviciosAfectados?: readonly string[] | null;
  readonly pacientesPotencialmenteAfectados?: string | null;
  readonly descripcion?: string | null;
}

export interface PlanReversaDto {
  readonly criterioActivacion?: string | null;
  readonly pasos?: readonly PasoPlanDto[] | null;
  readonly minutosEstimados?: number | null;
  readonly planContinuidad?: string | null;
  readonly responsableReversa?: string | null;
}

export interface EventoCambioDto {
  readonly fechaIso?: string | null;
  readonly usuarioNombre?: string | null;
  readonly estadoAnterior?: EstadoCambio | null;
  readonly estadoNuevo: EstadoCambio;
  readonly observacion?: string | null;
}

export interface CambioResumenDto {
  readonly id: number;
  readonly codigo: string;
  readonly titulo: string;
  readonly tipo: TipoCambio;
  readonly categoria: CategoriaCambio;
  readonly estado: EstadoCambio;
  readonly impacto: ImpactoAsistencial;
  readonly areasAfectadas?: readonly (AreaAfectadaDto | string)[] | null;
  readonly horario?: HorarioProgramadoDto | null;
  readonly solicitante?: string | null;
  readonly responsableEjecucion?: string | null;
  readonly fechaRegistroIso?: string | null;
  readonly fechaRegistro?: string | null;
}

export interface CambioDetalleDto extends CambioResumenDto {
  readonly descripcion?: string | null;
  readonly justificacion?: string | null;
  readonly equiposAfectados?: readonly string[] | null;
  readonly idTicketOrigen?: number | null;
  readonly evaluacion?: EvaluacionImpactoDto | null;
  readonly pasosImplementacion?: readonly PasoPlanDto[] | null;
  readonly planReversa?: PlanReversaDto | null;
  readonly observacionDecision?: string | null;
  readonly resultadoImplementacion?: string | null;
  readonly historial?: readonly EventoCambioDto[] | null;
}

export interface CambioSolicitudDto {
  readonly titulo: string;
  readonly tipo: TipoCambio;
  readonly categoria: CategoriaCambio;
  readonly descripcion: string;
  readonly justificacion: string;
  readonly equiposAfectados: readonly string[];
  readonly idTicketOrigen: number | null;
  readonly responsableEjecucion: string | null;
  readonly horario: { readonly inicioIso: string; readonly finIso: string } | null;
  readonly evaluacion: {
    readonly nivel: ImpactoAsistencial;
    readonly idsAreasAfectadas: readonly number[];
    readonly requiereInterrupcion: boolean;
    readonly minutosInterrupcion: number | null;
    readonly serviciosAfectados: readonly string[];
    readonly pacientesPotencialmenteAfectados: string | null;
    readonly descripcion: string;
  };
  readonly pasosImplementacion: readonly {
    readonly descripcion: string;
    readonly responsable?: string | null;
    readonly minutosEstimados?: number | null;
  }[];
  readonly planReversa: {
    readonly criterioActivacion: string;
    readonly pasos: readonly {
      readonly descripcion: string;
      readonly responsable?: string | null;
      readonly minutosEstimados?: number | null;
    }[];
    readonly minutosEstimados: number;
    readonly planContinuidad: string;
    readonly responsableReversa: string;
  };
}

export interface TransicionCambioDto {
  readonly accion: AccionCambio;
  readonly observacion: string | null;
}
