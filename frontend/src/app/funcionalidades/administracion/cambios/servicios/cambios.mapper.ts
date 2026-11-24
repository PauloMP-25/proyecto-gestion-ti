import {
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
  CambioResumen,
  EvaluacionImpacto,
  EventoCambio,
  HorarioProgramado,
  PasoPlan,
  PlanReversa,
} from '../modelos/cambios.model';
import { esAreaCritica } from '../utilidades/areas-criticas';
import {
  AreaAfectadaDto,
  AreaSeleccionableDto,
  CambioDetalleDto,
  CambioResumenDto,
  CambioSolicitudDto,
  EvaluacionImpactoDto,
  EventoCambioDto,
  HorarioProgramadoDto,
  PasoPlanDto,
  PlanReversaDto,
} from './cambios.dto';

function aHorario(dto: HorarioProgramadoDto | null | undefined): HorarioProgramado | null {
  if (!dto) {
    return null;
  }
  const inicio = dto.inicioIso ?? dto.inicio ?? dto.fechaInicio;
  const fin = dto.finIso ?? dto.fin ?? dto.fechaFin;
  if (!inicio || !fin) {
    return null;
  }
  return { inicioIso: inicio, finIso: fin };
}

export function aAreaAfectada(dto: AreaAfectadaDto | string): AreaAfectada {
  if (typeof dto === 'string') {
    return { idArea: 0, nombre: dto, esCritica: esAreaCritica(dto) };
  }
  return {
    idArea: dto.idArea,
    nombre: dto.nombre,
    esCritica: dto.esCritica ?? esAreaCritica(dto.nombre),
  };
}

export function aAreaSeleccionable(dto: AreaSeleccionableDto): AreaAfectada {
  const nombre = dto.nombre;
  return {
    idArea: dto.idArea ?? dto.id ?? 0,
    nombre,
    esCritica: dto.esCritica ?? esAreaCritica(nombre),
  };
}

export function aPasoPlan(dto: PasoPlanDto, indice: number): PasoPlan {
  return {
    orden: dto.orden ?? indice + 1,
    descripcion: dto.descripcion,
    responsable: dto.responsable ?? null,
    minutosEstimados: dto.minutosEstimados ?? null,
  };
}

export function aEvaluacion(dto: EvaluacionImpactoDto | null | undefined): EvaluacionImpacto {
  return {
    nivel: dto?.nivel ?? 'BAJO',
    areasAfectadas: (dto?.areasAfectadas ?? []).map(aAreaAfectada),
    requiereInterrupcion: dto?.requiereInterrupcion ?? false,
    minutosInterrupcion: dto?.minutosInterrupcion ?? null,
    serviciosAfectados: dto?.serviciosAfectados ?? [],
    pacientesPotencialmenteAfectados: dto?.pacientesPotencialmenteAfectados ?? null,
    descripcion: dto?.descripcion ?? '',
  };
}

export function aPlanReversa(dto: PlanReversaDto | null | undefined): PlanReversa {
  return {
    criterioActivacion: dto?.criterioActivacion ?? '',
    pasos: (dto?.pasos ?? []).map(aPasoPlan),
    minutosEstimados: dto?.minutosEstimados ?? 0,
    planContinuidad: dto?.planContinuidad ?? '',
    responsableReversa: dto?.responsableReversa ?? '',
  };
}

export function aEventoCambio(dto: EventoCambioDto): EventoCambio {
  return {
    fechaIso: dto.fechaIso ?? '',
    usuarioNombre: dto.usuarioNombre ?? '',
    estadoAnterior: dto.estadoAnterior ?? null,
    estadoNuevo: dto.estadoNuevo,
    observacion: dto.observacion ?? null,
  };
}

export function aCambioResumen(dto: CambioResumenDto): CambioResumen {
  return {
    id: dto.id,
    codigo: dto.codigo,
    titulo: dto.titulo,
    tipo: dto.tipo,
    categoria: dto.categoria,
    estado: dto.estado,
    impacto: dto.impacto,
    areasAfectadas: (dto.areasAfectadas ?? []).map((area) =>
      typeof area === 'string' ? area : area.nombre,
    ),
    horario: aHorario(dto.horario),
    solicitante: dto.solicitante ?? '',
    responsableEjecucion: dto.responsableEjecucion ?? null,
    fechaRegistroIso: dto.fechaRegistroIso ?? dto.fechaRegistro ?? '',
  };
}

export function aCambioDetalle(dto: CambioDetalleDto): CambioDetalle {
  return {
    ...aCambioResumen(dto),
    descripcion: dto.descripcion ?? '',
    justificacion: dto.justificacion ?? '',
    equiposAfectados: dto.equiposAfectados ?? [],
    idTicketOrigen: dto.idTicketOrigen ?? null,
    evaluacion: aEvaluacion(dto.evaluacion),
    pasosImplementacion: (dto.pasosImplementacion ?? []).map(aPasoPlan),
    planReversa: aPlanReversa(dto.planReversa),
    observacionDecision: dto.observacionDecision ?? null,
    resultadoImplementacion: dto.resultadoImplementacion ?? null,
    historial: (dto.historial ?? []).map(aEventoCambio),
  };
}

export function aCambioSolicitudDto(formulario: CambioFormulario): CambioSolicitudDto {
  return {
    titulo: formulario.titulo.trim(),
    tipo: formulario.tipo,
    categoria: formulario.categoria,
    descripcion: formulario.descripcion.trim(),
    justificacion: formulario.justificacion.trim(),
    equiposAfectados: formulario.equiposAfectados,
    idTicketOrigen: formulario.idTicketOrigen,
    responsableEjecucion: formulario.responsableEjecucion?.trim() || null,
    horario: formulario.horario,
    evaluacion: {
      nivel: formulario.evaluacion.nivel,
      idsAreasAfectadas: formulario.evaluacion.idsAreasAfectadas,
      requiereInterrupcion: formulario.evaluacion.requiereInterrupcion,
      minutosInterrupcion: formulario.evaluacion.minutosInterrupcion,
      serviciosAfectados: formulario.evaluacion.serviciosAfectados,
      pacientesPotencialmenteAfectados:
        formulario.evaluacion.pacientesPotencialmenteAfectados?.trim() || null,
      descripcion: formulario.evaluacion.descripcion.trim(),
    },
    pasosImplementacion: formulario.pasosImplementacion.map((paso) => ({
      descripcion: paso.descripcion.trim(),
      responsable: paso.responsable?.trim() || null,
      minutosEstimados: paso.minutosEstimados ?? null,
    })),
    planReversa: {
      criterioActivacion: formulario.planReversa.criterioActivacion.trim(),
      pasos: formulario.planReversa.pasos.map((paso) => ({
        descripcion: paso.descripcion.trim(),
        responsable: paso.responsable?.trim() || null,
        minutosEstimados: paso.minutosEstimados ?? null,
      })),
      minutosEstimados: formulario.planReversa.minutosEstimados,
      planContinuidad: formulario.planReversa.planContinuidad.trim(),
      responsableReversa: formulario.planReversa.responsableReversa.trim(),
    },
  };
}
