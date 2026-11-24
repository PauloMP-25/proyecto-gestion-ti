/** Ciclo de vida de una solicitud de cambio técnico. */
export type EstadoCambio =
  | 'BORRADOR'
  | 'EN_EVALUACION'
  | 'APROBADO'
  | 'EN_EJECUCION'
  | 'IMPLEMENTADO'
  | 'RECHAZADO';

export const ESTADOS_CAMBIO: readonly EstadoCambio[] = [
  'BORRADOR',
  'EN_EVALUACION',
  'APROBADO',
  'EN_EJECUCION',
  'IMPLEMENTADO',
  'RECHAZADO',
];

/** Naturaleza del cambio. */
export type TipoCambio =
  | 'RUTINARIO'
  | 'PROGRAMADO'
  | 'URGENTE';

/** Impacto sobre la atención de pacientes. */
export type ImpactoAsistencial = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

/** Categoría técnica de lo que se interviene. */
export type CategoriaCambio =
  | 'SISTEMA_CLINICO'
  | 'RED'
  | 'SERVIDOR'
  | 'EQUIPO_USUARIO'
  | 'SEGURIDAD';

export interface AreaAfectada {
  readonly idArea: number;
  readonly nombre: string;
  readonly esCritica: boolean;
}

export interface PasoPlan {
  readonly orden: number;
  readonly descripcion: string;
  readonly responsable?: string | null;
  readonly minutosEstimados?: number | null;
}

/** Evaluación de impacto asistencial. */
export interface EvaluacionImpacto {
  readonly nivel: ImpactoAsistencial;
  readonly areasAfectadas: readonly AreaAfectada[];
  readonly requiereInterrupcion: boolean;
  readonly minutosInterrupcion: number | null;
  readonly serviciosAfectados: readonly string[];
  readonly pacientesPotencialmenteAfectados: string | null;
  readonly descripcion: string;
}

/** Plan de reversa + plan de continuidad asistencial. */
export interface PlanReversa {
  readonly criterioActivacion: string;
  readonly pasos: readonly PasoPlan[];
  readonly minutosEstimados: number;
  readonly planContinuidad: string;
  readonly responsableReversa: string;
}

export interface HorarioProgramado {
  readonly inicioIso: string;
  readonly finIso: string;
}

export interface EventoCambio {
  readonly fechaIso: string;
  readonly usuarioNombre: string;
  readonly estadoAnterior: EstadoCambio | null;
  readonly estadoNuevo: EstadoCambio;
  readonly observacion: string | null;
}

/** Lo mínimo para la tabla/tarjeta. */
export interface CambioResumen {
  readonly id: number;
  readonly codigo: string;
  readonly titulo: string;
  readonly tipo: TipoCambio;
  readonly categoria: CategoriaCambio;
  readonly estado: EstadoCambio;
  readonly impacto: ImpactoAsistencial;
  readonly areasAfectadas: readonly string[];
  readonly horario: HorarioProgramado | null;
  readonly solicitante: string;
  readonly responsableEjecucion: string | null;
  readonly fechaRegistroIso: string;
}

/** Detalle completo para el panel lateral. */
export interface CambioDetalle extends CambioResumen {
  readonly descripcion: string;
  readonly justificacion: string;
  readonly equiposAfectados: readonly string[];
  readonly idTicketOrigen: number | null;
  readonly evaluacion: EvaluacionImpacto;
  readonly pasosImplementacion: readonly PasoPlan[];
  readonly planReversa: PlanReversa;
  readonly observacionDecision: string | null;
  readonly resultadoImplementacion: string | null;
  readonly historial: readonly EventoCambio[];
}

/** Lo que envía el formulario (crear / editar borrador). */
export interface CambioFormulario {
  titulo: string;
  tipo: TipoCambio;
  categoria: CategoriaCambio;
  descripcion: string;
  justificacion: string;
  equiposAfectados: string[];
  idTicketOrigen: number | null;
  responsableEjecucion: string | null;
  horario: HorarioProgramado | null;
  evaluacion: {
    nivel: ImpactoAsistencial;
    idsAreasAfectadas: number[];
    requiereInterrupcion: boolean;
    minutosInterrupcion: number | null;
    serviciosAfectados: string[];
    pacientesPotencialmenteAfectados: string | null;
    descripcion: string;
  };
  pasosImplementacion: Omit<PasoPlan, 'orden'>[];
  planReversa: Omit<PlanReversa, 'pasos'> & { pasos: Omit<PasoPlan, 'orden'>[] };
}

/** Acción de transición de estado. */
export type AccionCambio =
  | 'ENVIAR_EVALUACION'
  | 'APROBAR'
  | 'RECHAZAR'
  | 'DEVOLVER_BORRADOR'
  | 'INICIAR_EJECUCION'
  | 'MARCAR_IMPLEMENTADO';

export interface TransicionCambio {
  readonly accion: AccionCambio;
  readonly observacion: string | null;
}

export interface FiltroCambios {
  texto: string;
  estado: EstadoCambio | null;
  impacto: ImpactoAsistencial | null;
  tipo: TipoCambio | null;
}

export const FILTRO_CAMBIOS_INICIAL: FiltroCambios = {
  texto: '',
  estado: null,
  impacto: null,
  tipo: null,
};
