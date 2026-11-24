import { TonoInsignia } from '../../../../compartido/ui/atomos/insignia/insignia.component';
import {
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
