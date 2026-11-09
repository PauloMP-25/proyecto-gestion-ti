import { EstadoSLA } from './estado-sla.enum';

export interface SlaInfo {
  fechaInicio: string; // ISO 8601
  fechaVencimiento: string; // ISO 8601
  estado: EstadoSLA;
  porcentajeConsumido: number; // 0 a 100+
  tiempoRestanteMinutos?: number;
}
