import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import {
  CambioDetalle,
  CambioFormulario,
  CategoriaCambio,
  ImpactoAsistencial,
  PasoPlan,
  TipoCambio,
} from '../../modelos/cambios.model';
import { validadorInterrupcion, validadorPlanReversa } from '../../utilidades/validadores-cambio';

export interface PasoForm {
  descripcion: FormControl<string>;
}

export type PasosForm = FormArray<FormGroup<PasoForm>>;

export interface GeneralesForm {
  titulo: FormControl<string>;
  tipo: FormControl<TipoCambio>;
  categoria: FormControl<CategoriaCambio>;
  descripcion: FormControl<string>;
  justificacion: FormControl<string>;
  equiposAfectados: FormControl<string[]>;
  idTicketOrigen: FormControl<number | null>;
  responsableEjecucion: FormControl<string>;
  horarioInicio: FormControl<string>;
  horarioFin: FormControl<string>;
  pasos: PasosForm;
}

export interface ImpactoForm {
  idsAreasAfectadas: FormControl<number[]>;
  nivel: FormControl<ImpactoAsistencial>;
  requiereInterrupcion: FormControl<boolean>;
  minutosInterrupcion: FormControl<number | null>;
  serviciosAfectados: FormControl<string[]>;
  pacientesPotencialmenteAfectados: FormControl<string>;
  descripcion: FormControl<string>;
}

export interface ReversaForm {
  reversaCriterio: FormControl<string>;
  reversaPasos: PasosForm;
  reversaMinutos: FormControl<number | null>;
  responsableReversa: FormControl<string>;
  planContinuidad: FormControl<string>;
}

export interface FormularioCambioVista {
  generales: FormGroup<GeneralesForm>;
  impacto: FormGroup<ImpactoForm>;
  reversa: FormGroup<ReversaForm>;
}

export function crearPaso(texto = ''): FormGroup<PasoForm> {
  return new FormGroup<PasoForm>({
    descripcion: new FormControl(texto, { nonNullable: true }),
  });
}

export function crearFormularioCambio(fb: NonNullableFormBuilder): FormularioCambioVista {
  const generales = fb.group<GeneralesForm>({
    titulo: fb.control('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(120),
    ]),
    tipo: fb.control<TipoCambio>('PROGRAMADO'),
    categoria: fb.control<CategoriaCambio>('SISTEMA_CLINICO'),
    descripcion: fb.control(''),
    justificacion: fb.control('', [Validators.required, Validators.minLength(20)]),
    equiposAfectados: fb.control<string[]>([]),
    idTicketOrigen: fb.control<number | null>(null),
    responsableEjecucion: fb.control(''),
    horarioInicio: fb.control(''),
    horarioFin: fb.control(''),
    pasos: fb.array<FormGroup<PasoForm>>([crearPaso()]),
  });

  const impacto = fb.group<ImpactoForm>(
    {
      idsAreasAfectadas: fb.control<number[]>([]),
      nivel: fb.control<ImpactoAsistencial>('MEDIO'),
      requiereInterrupcion: fb.control(false),
      minutosInterrupcion: fb.control<number | null>(null),
      serviciosAfectados: fb.control<string[]>([]),
      pacientesPotencialmenteAfectados: fb.control(''),
      descripcion: fb.control(''),
    },
    { validators: [validadorInterrupcion] },
  );

  const reversa = fb.group<ReversaForm>(
    {
      reversaCriterio: fb.control(''),
      reversaPasos: fb.array<FormGroup<PasoForm>>([crearPaso()]),
      reversaMinutos: fb.control<number | null>(null),
      responsableReversa: fb.control(''),
      planContinuidad: fb.control(''),
    },
    { validators: [validadorPlanReversa] },
  );

  return { generales, impacto, reversa };
}

function reemplazarPasos(array: PasosForm, textos: readonly string[]): void {
  array.clear();
  const valores = textos.length > 0 ? textos : [''];
  for (const texto of valores) {
    array.push(crearPaso(texto));
  }
}

export function completarFormularioCambio(
  formulario: FormularioCambioVista,
  detalle: CambioDetalle,
): void {
  formulario.generales.patchValue({
    titulo: detalle.titulo,
    tipo: detalle.tipo,
    categoria: detalle.categoria,
    descripcion: detalle.descripcion,
    justificacion: detalle.justificacion,
    equiposAfectados: [...detalle.equiposAfectados],
    idTicketOrigen: detalle.idTicketOrigen,
    responsableEjecucion: detalle.responsableEjecucion ?? '',
    horarioInicio: aDatetimeLocal(detalle.horario?.inicioIso),
    horarioFin: aDatetimeLocal(detalle.horario?.finIso),
  });
  reemplazarPasos(
    formulario.generales.controls.pasos,
    detalle.pasosImplementacion.map((paso) => paso.descripcion),
  );

  formulario.impacto.patchValue({
    idsAreasAfectadas: detalle.evaluacion.areasAfectadas.map((area) => area.idArea),
    nivel: detalle.evaluacion.nivel,
    requiereInterrupcion: detalle.evaluacion.requiereInterrupcion,
    minutosInterrupcion: detalle.evaluacion.minutosInterrupcion,
    serviciosAfectados: [...detalle.evaluacion.serviciosAfectados],
    pacientesPotencialmenteAfectados: detalle.evaluacion.pacientesPotencialmenteAfectados ?? '',
    descripcion: detalle.evaluacion.descripcion,
  });

  formulario.reversa.patchValue({
    reversaCriterio: detalle.planReversa.criterioActivacion,
    reversaMinutos: detalle.planReversa.minutosEstimados,
    responsableReversa: detalle.planReversa.responsableReversa,
    planContinuidad: detalle.planReversa.planContinuidad,
  });
  reemplazarPasos(
    formulario.reversa.controls.reversaPasos,
    detalle.planReversa.pasos.map((paso) => paso.descripcion),
  );
}

export function aCambioFormulario(formulario: FormularioCambioVista): CambioFormulario {
  const generales = formulario.generales.getRawValue();
  const impacto = formulario.impacto.getRawValue();
  const reversa = formulario.reversa.getRawValue();

  return {
    titulo: generales.titulo.trim(),
    tipo: generales.tipo,
    categoria: generales.categoria,
    descripcion: generales.descripcion.trim(),
    justificacion: generales.justificacion.trim(),
    equiposAfectados: generales.equiposAfectados,
    idTicketOrigen: generales.idTicketOrigen,
    responsableEjecucion: generales.responsableEjecucion.trim() || null,
    horario: aHorario(generales.horarioInicio, generales.horarioFin),
    evaluacion: {
      nivel: impacto.nivel,
      idsAreasAfectadas: impacto.idsAreasAfectadas,
      requiereInterrupcion: impacto.requiereInterrupcion,
      minutosInterrupcion: impacto.requiereInterrupcion ? impacto.minutosInterrupcion : null,
      serviciosAfectados: impacto.serviciosAfectados,
      pacientesPotencialmenteAfectados:
        impacto.pacientesPotencialmenteAfectados.trim() || null,
      descripcion: impacto.descripcion.trim(),
    },
    pasosImplementacion: mapearPasos(generales.pasos),
    planReversa: {
      criterioActivacion: reversa.reversaCriterio.trim(),
      pasos: mapearPasos(reversa.reversaPasos),
      minutosEstimados: reversa.reversaMinutos ?? 0,
      planContinuidad: reversa.planContinuidad.trim(),
      responsableReversa: reversa.responsableReversa.trim(),
    },
  };
}

function mapearPasos(pasos: readonly { descripcion: string }[]): Omit<PasoPlan, 'orden'>[] {
  return pasos
    .map((paso) => paso.descripcion.trim())
    .filter((descripcion) => descripcion.length > 0)
    .map((descripcion) => ({ descripcion }));
}

function aHorario(inicio: string, fin: string): { inicioIso: string; finIso: string } | null {
  if (!inicio || !fin) {
    return null;
  }
  const inicioFecha = new Date(inicio);
  const finFecha = new Date(fin);
  if (Number.isNaN(inicioFecha.getTime()) || Number.isNaN(finFecha.getTime())) {
    return null;
  }
  return { inicioIso: inicioFecha.toISOString(), finIso: finFecha.toISOString() };
}

export function aDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  const dos = (numero: number): string => String(numero).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

export function duracionMinutos(inicio: string, fin: string): number | null {
  if (!inicio || !fin) {
    return null;
  }
  const inicioMs = Date.parse(inicio);
  const finMs = Date.parse(fin);
  if (Number.isNaN(inicioMs) || Number.isNaN(finMs) || finMs <= inicioMs) {
    return null;
  }
  return Math.round((finMs - inicioMs) / 60000);
}
