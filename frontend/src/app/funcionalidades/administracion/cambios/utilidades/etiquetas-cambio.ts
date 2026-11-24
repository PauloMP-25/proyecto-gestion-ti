import { TonoInsignia } from '../../../../compartido/ui/atomos/insignia/insignia.component';
import { VarianteBoton } from '../../../../compartido/ui/atomos/boton/boton.component';
import {
  AccionCambio,
  CategoriaCambio,
  EstadoCambio,
  ImpactoAsistencial,
  TipoCambio,
} from '../modelos/cambios.model';

interface Presentacion {
  readonly texto: string;
  readonly tono: TonoInsignia;
  readonly icono: string;
}

export const PRESENTACION_ESTADO: Record<EstadoCambio, Presentacion> = {
  BORRADOR: { texto: 'Borrador', tono: 'neutro', icono: 'edit_note' },
  EN_EVALUACION: { texto: 'En evaluación', tono: 'aviso', icono: 'fact_check' },
  APROBADO: { texto: 'Aprobado', tono: 'info', icono: 'verified' },
  EN_EJECUCION: { texto: 'En ejecución', tono: 'marca', icono: 'engineering' },
  IMPLEMENTADO: { texto: 'Implementado', tono: 'exito', icono: 'task_alt' },
  RECHAZADO: { texto: 'Rechazado', tono: 'peligro', icono: 'cancel' },
};

export const PRESENTACION_IMPACTO: Record<
  ImpactoAsistencial,
  Presentacion & { ayuda: string }
> = {
  BAJO: {
    texto: 'Impacto bajo',
    tono: 'neutro',
    icono: 'check_circle',
    ayuda: 'No afecta la atención de pacientes.',
  },
  MEDIO: {
    texto: 'Impacto medio',
    tono: 'info',
    icono: 'info',
    ayuda: 'Afecta un servicio de apoyo (ej. impresión, correo) con alternativa disponible.',
  },
  ALTO: {
    texto: 'Impacto alto',
    tono: 'aviso',
    icono: 'warning',
    ayuda: 'Afecta un servicio asistencial (admisión, farmacia, laboratorio).',
  },
  CRITICO: {
    texto: 'Impacto crítico',
    tono: 'peligro',
    icono: 'emergency',
    ayuda: 'Afecta áreas críticas: Emergencia, UCI, Centro Quirúrgico o Neonatología.',
  },
};

export const PRESENTACION_TIPO: Record<TipoCambio, Presentacion> = {
  RUTINARIO: { texto: 'Rutinario', tono: 'neutro', icono: 'sync' },
  PROGRAMADO: { texto: 'Programado', tono: 'info', icono: 'calendar_today' },
  URGENTE: { texto: 'Urgente', tono: 'peligro', icono: 'notification_important' },
};

export const ETIQUETA_CATEGORIA: Record<CategoriaCambio, string> = {
  SISTEMA_CLINICO: 'Sistema clínico (HIS)',
  RED: 'Redes y conectividad',
  SERVIDOR: 'Servidores y respaldos',
  EQUIPO_USUARIO: 'Equipos de usuario',
  SEGURIDAD: 'Seguridad y accesos',
};

export interface PresentacionAccionCambio {
  readonly textoBoton: string;
  readonly variante: VarianteBoton;
  readonly icono: string;
  readonly tituloDialogo: string;
  readonly etiquetaObservacion: string | null;
  readonly descripcion: string;
}

export const PRESENTACION_ACCION: Record<AccionCambio, PresentacionAccionCambio> = {
  ENVIAR_EVALUACION: {
    textoBoton: 'Enviar al comité de evaluación',
    variante: 'primario',
    icono: 'send',
    tituloDialogo: '¿Enviar este cambio al comité de evaluación?',
    etiquetaObservacion: null,
    descripcion: 'La solicitud pasará al comité de evaluación técnica para su revisión.',
  },
  APROBAR: {
    textoBoton: 'Aprobar cambio',
    variante: 'exito',
    icono: 'verified',
    tituloDialogo: '¿Aprobar el cambio {codigo}?',
    etiquetaObservacion: 'Observación (opcional)',
    descripcion: 'El cambio quedará aprobado y podrá programarse para ejecución.',
  },
  RECHAZAR: {
    textoBoton: 'Rechazar',
    variante: 'peligro',
    icono: 'cancel',
    tituloDialogo: '¿Rechazar el cambio {codigo}?',
    etiquetaObservacion: 'Motivo del rechazo',
    descripcion: 'Explique el motivo para que el responsable pueda corregirlo en una nueva solicitud.',
  },
  DEVOLVER_BORRADOR: {
    textoBoton: 'Solicitar correcciones',
    variante: 'outline',
    icono: 'edit_note',
    tituloDialogo: '¿Solicitar correcciones al cambio {codigo}?',
    etiquetaObservacion: 'Correcciones solicitadas',
    descripcion: 'La solicitud volverá al responsable para que complete o corrija la información.',
  },
  INICIAR_EJECUCION: {
    textoBoton: 'Iniciar intervención',
    variante: 'primario',
    icono: 'engineering',
    tituloDialogo: '¿Iniciar la intervención del cambio {codigo}?',
    etiquetaObservacion: null,
    descripcion: 'La intervención quedará registrada como en curso. Coordine con las áreas afectadas.',
  },
  MARCAR_IMPLEMENTADO: {
    textoBoton: 'Registrar como implementado',
    variante: 'exito',
    icono: 'task_alt',
    tituloDialogo: '¿Registrar el cambio {codigo} como implementado?',
    etiquetaObservacion: 'Resultado de la intervención',
    descripcion: 'Registre el resultado de la intervención para cerrar el cambio.',
  },
};

export function tituloDialogoAccion(accion: AccionCambio, codigo: string): string {
  return PRESENTACION_ACCION[accion].tituloDialogo.replace('{codigo}', codigo);
}
