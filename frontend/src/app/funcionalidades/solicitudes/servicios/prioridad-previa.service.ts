import { Injectable } from '@angular/core';
import { Impacto, Urgencia } from '../../../compartido/modelos/impacto-urgencia.enum';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';

export interface PrioridadPrevia {
  prioridad: PrioridadTicket;
  respuestaMin: number;
  resolucionMin: number;
  textoRespuesta: string;
  textoResolucion: string;
}

const MATRIZ: Record<Impacto, Record<Urgencia, PrioridadTicket>> = {
  ALTO: { ALTA: PrioridadTicket.P1, MEDIA: PrioridadTicket.P1, BAJA: PrioridadTicket.P2 },
  MEDIO: { ALTA: PrioridadTicket.P1, MEDIA: PrioridadTicket.P2, BAJA: PrioridadTicket.P3 },
  BAJO: { ALTA: PrioridadTicket.P2, MEDIA: PrioridadTicket.P3, BAJA: PrioridadTicket.P4 },
};

const TIEMPOS_MIN: Record<PrioridadTicket, { respuesta: number; resolucion: number }> = {
  P1: { respuesta: 15, resolucion: 120 },
  P2: { respuesta: 30, resolucion: 240 },
  P3: { respuesta: 120, resolucion: 480 },
  P4: { respuesta: 240, resolucion: 1440 },
};

function textoTiempo(min: number): string {
  return min < 60 ? `${min} min` : `${min / 60} h`;
}

// Solo visual: el backend siempre recalcula la prioridad definitiva
@Injectable({ providedIn: 'root' })
export class PrioridadPreviaService {
  calcular(impacto: Impacto, urgencia: Urgencia): PrioridadPrevia {
    const prioridad = MATRIZ[impacto][urgencia];
    const tiempos = TIEMPOS_MIN[prioridad];
    return {
      prioridad,
      respuestaMin: tiempos.respuesta,
      resolucionMin: tiempos.resolucion,
      textoRespuesta: textoTiempo(tiempos.respuesta),
      textoResolucion: textoTiempo(tiempos.resolucion),
    };
  }
}