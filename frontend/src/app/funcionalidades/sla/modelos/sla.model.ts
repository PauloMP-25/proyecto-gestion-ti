import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';

export interface ReglaSlaConfiguracion {
  prioridad: PrioridadTicket;
  nombre: string;
  tiempoRespuestaMin: number;
  tiempoResolucionMin: number;
  colorClase: string;
  aplicaHorarioLaboral: boolean;
  notificarJefaturaMin: number;
  descripcionHospitalaria: string;
}

export interface MetricasSlaGlobal {
  porcentajeCumplimientoGlobal: number; // Ej: 92.4%
  totalTicketsEvaluados: number;
  ticketsCumplidos: number;
  ticketsEnAlerta: number;
  ticketsIncumplidos: number;
  tiempoPromedioRespuestaMin: number;
  tiempoPromedioResolucionMin: number;
}

export interface CumplimientoSlaPorArea {
  idArea: number;
  areaNombre: string;
  totalTickets: number;
  cumplidos: number;
  porcentajeCumplimiento: number;
  estadoGeneral: EstadoSla;
}

export interface TicketMonitoreoSla {
  id: string | number;
  codigo: string;
  titulo: string;
  areaClinica: string;
  prioridad: PrioridadTicket;
  estadoSla: EstadoSla;
  tiempoTotalMinutos: number;
  minutosConsumidos: number;
  minutosRestantes: number;
  porcentajeConsumido: number;
  fechaCreacion: string;
  fechaLimiteResolucion: string;
  tecnicoAsignado?: string;
}

export interface ConfiguracionKpiItem {
  idKpi?: number;
  codigo: string;
  titulo: string;
  metaValor: number;
  unidad: string;
  comparador: string;
  formula?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface AreaPrioridadItem {
  id: number;
  nombre: string;
  piso: number | null;
  anexo: string | null;
  activo: boolean;
  prioridadDefecto: string; // 'P1' | 'P2' | 'P3' | 'P4'
}
