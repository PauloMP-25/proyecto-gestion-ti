import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ImpactoAsistencial, TipoCambio } from '../modelos/cambios.model';

const HORA_INICIO_TURNO_NORMAL = 7;
const HORA_FIN_TURNO_NORMAL = 19;

export interface DatosHorario {
  readonly inicioIso: string | null | undefined;
  readonly finIso: string | null | undefined;
  readonly tipo: TipoCambio;
  readonly nivel: ImpactoAsistencial;
  readonly requiereHorario: boolean;
  readonly ahoraMs: number;
}

export interface PasoValidable {
  readonly descripcion: string;
}

export function esHorarioDiurno(iso: string): boolean {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return false;
  }
  const hora = fecha.getHours();
  return hora >= HORA_INICIO_TURNO_NORMAL && hora < HORA_FIN_TURNO_NORMAL;
}

export function evaluarHorario(datos: DatosHorario): ValidationErrors | null {
  const inicio = datos.inicioIso?.trim() ?? '';
  const fin = datos.finIso?.trim() ?? '';

  if (!inicio && !fin) {
    return datos.requiereHorario ? { horarioRequerido: true } : null;
  }
  if (!inicio || !fin) {
    return { horarioIncompleto: true };
  }

  const inicioMs = Date.parse(inicio);
  const finMs = Date.parse(fin);
  if (Number.isNaN(inicioMs) || Number.isNaN(finMs)) {
    return { horarioInvalido: true };
  }
  if (finMs <= inicioMs) {
    return { finNoPosterior: true };
  }
  if (datos.tipo !== 'URGENTE' && inicioMs <= datos.ahoraMs) {
    return { inicioNoFuturo: true };
  }
  if (
    datos.nivel === 'CRITICO' &&
    datos.tipo !== 'URGENTE' &&
    esHorarioDiurno(inicio)
  ) {
    return { horarioCriticoDiurno: true };
  }

  return null;
}

export function evaluarInterrupcion(
  requiereInterrupcion: boolean,
  minutosInterrupcion: number | null | undefined,
): ValidationErrors | null {
  if (!requiereInterrupcion) {
    return null;
  }
  if (minutosInterrupcion === null || minutosInterrupcion === undefined || minutosInterrupcion <= 0) {
    return { minutosInterrupcionRequeridos: true };
  }
  return null;
}

export function evaluarPlanReversa(
  criterioActivacion: string | null | undefined,
  pasos: readonly PasoValidable[] | null | undefined,
  minutosEstimados: number | null | undefined,
): ValidationErrors | null {
  const criterio = criterioActivacion?.trim() ?? '';
  const pasosValidos = (pasos ?? []).filter((paso) => paso.descripcion.trim().length > 0);
  const minutos = minutosEstimados ?? 0;

  if (!criterio || pasosValidos.length === 0 || minutos <= 0) {
    return { planReversaIncompleto: true };
  }
  return null;
}

export function evaluarContinuidad(
  nivel: ImpactoAsistencial,
  planContinuidad: string | null | undefined,
): ValidationErrors | null {
  if (nivel === 'ALTO' || nivel === 'CRITICO') {
    return planContinuidad?.trim() ? null : { continuidadRequerida: true };
  }
  return null;
}

/** V11 — Sugerencia de impacto crítico cuando hay áreas críticas seleccionadas. */
export function sugiereImpactoCritico(
  areas: readonly { readonly esCritica: boolean }[],
  nivelActual: ImpactoAsistencial,
): boolean {
  return nivelActual !== 'CRITICO' && areas.some((area) => area.esCritica);
}

/** V12 — Aviso cuando el tiempo de reversa supera el horario programado. */
export function reversaExcedeHorario(
  inicioIso: string | null | undefined,
  finIso: string | null | undefined,
  minutosReversa: number | null | undefined,
): boolean {
  if (!inicioIso || !finIso || !minutosReversa || minutosReversa <= 0) {
    return false;
  }
  const inicioMs = Date.parse(inicioIso);
  const finMs = Date.parse(finIso);
  if (Number.isNaN(inicioMs) || Number.isNaN(finMs) || finMs <= inicioMs) {
    return false;
  }
  const duracionMinutos = (finMs - inicioMs) / 60000;
  return minutosReversa > duracionMinutos;
}

export function validadorHorario(requiereHorario = false): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null =>
    evaluarHorario({
      inicioIso: grupo.get('horarioInicio')?.value,
      finIso: grupo.get('horarioFin')?.value,
      tipo: grupo.get('tipo')?.value as TipoCambio,
      nivel: grupo.get('nivel')?.value as ImpactoAsistencial,
      requiereHorario,
      ahoraMs: Date.now(),
    });
}

export const validadorInterrupcion: ValidatorFn = (
  grupo: AbstractControl,
): ValidationErrors | null =>
  evaluarInterrupcion(
    Boolean(grupo.get('requiereInterrupcion')?.value),
    grupo.get('minutosInterrupcion')?.value,
  );

export const validadorPlanReversa: ValidatorFn = (
  grupo: AbstractControl,
): ValidationErrors | null => {
  const pasos = grupo.get('reversaPasos')?.value as PasoValidable[] | null;
  return evaluarPlanReversa(
    grupo.get('reversaCriterio')?.value,
    pasos,
    grupo.get('reversaMinutos')?.value,
  );
};

export const validadorContinuidad: ValidatorFn = (
  grupo: AbstractControl,
): ValidationErrors | null =>
  evaluarContinuidad(
    grupo.get('nivel')?.value as ImpactoAsistencial,
    grupo.get('planContinuidad')?.value,
  );
