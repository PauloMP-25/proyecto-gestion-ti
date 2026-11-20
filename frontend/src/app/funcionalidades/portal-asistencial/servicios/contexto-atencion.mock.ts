import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { ContextoAtencionApi } from './contexto-atencion.api';
import {
  ContextoAtencion,
  ReportarProblemaSolicitud,
} from '../modelos/contexto-atencion.model';
import { Ticket } from '../../../compartido/modelos/ticket.model';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';

export const CONTEXTO_DEFAULT_MOCK: ContextoAtencion = {
  estadoDeteccion: 'DETECTADO',
  ipOrigen: '192.168.10.12',
  equipo: {
    id: 7,
    codigoInventario: 'PC-ADM-02',
    nombre: 'Computadora Admisión 2',
    tipo: 'COMPUTADORA',
    referenciaUbicacion: 'Ventanilla 2',
  },
  area: {
    id: 1,
    nombre: 'Admisión',
    ubicacionLegible: 'Primer Piso',
    referenciaUbicacion: 'Frente a la Oficina de la Jefatura de Estadística',
    anexo: '105',
    encargado: {
      id: 3,
      nombreVisible: 'Lic. Patricia Ramos',
    },
  },
  impresorasArea: [
    {
      id: 11,
      codigoInventario: 'IMP-ADM-01',
      nombre: 'Impresora Admisión 1',
      referenciaUbicacion: 'Junto a ventanilla 1',
      ipEstatica: '192.168.10.21',
    },
    {
      id: 12,
      codigoInventario: 'IMP-ADM-02',
      nombre: 'Impresora Admisión 2',
      referenciaUbicacion: 'Junto a ventanilla 4',
      ipEstatica: '192.168.10.22',
    },
  ],
  persona: {
    id: 21,
    nombreVisible: 'Lic. Patricia Ramos',
    grado: 'LIC',
    areaAdscrita: {
      id: 1,
      nombre: 'Admisión',
    },
  },
  personaEnOtraArea: false,
};

@Injectable()
export class ContextoAtencionMock extends ContextoAtencionApi {
  private contextoActual: ContextoAtencion = { ...CONTEXTO_DEFAULT_MOCK };
  private correlativo = 100;

  obtenerContexto(): Observable<ContextoAtencion> {
    return of({ ...this.contextoActual }).pipe(delay(20));
  }

  reportarProblema(solicitud: ReportarProblemaSolicitud): Observable<Ticket> {
    this.correlativo++;
    const ahora = new Date().toISOString();
    const idTicket = this.correlativo;

    let equipoTicket = null;
    if (solicitud.objetivo === 'EQUIPO_ACTUAL' && this.contextoActual.equipo) {
      equipoTicket = {
        id: this.contextoActual.equipo.id,
        hostname: this.contextoActual.equipo.codigoInventario,
        ip: this.contextoActual.ipOrigen,
      };
    } else if (solicitud.objetivo === 'IMPRESORA_AREA' && solicitud.idImpresora) {
      const imp = this.contextoActual.impresorasArea.find(i => i.id === solicitud.idImpresora);
      if (imp) {
        equipoTicket = {
          id: imp.id,
          hostname: imp.codigoInventario,
          ip: imp.ipEstatica ?? null,
        };
      }
    }

    const ticket: Ticket = {
      id: idTicket,
      codigo: `INC-2026-${String(idTicket).padStart(4, '0')}`,
      tipo: solicitud.tipo,
      titulo: solicitud.asunto,
      descripcion: solicitud.descripcion,
      prioridad: PrioridadTicket.P3,
      estado: EstadoTicket.NUEVO,
      estadoSla: EstadoSLA.A_TIEMPO,
      nivelSoporte: NivelSoporte.N1,
      categoria: { id: 1, nombre: 'Hardware / Equipos' },
      historial: [],
      escalamientos: [],
      soluciones: [],
      area: {
        id: this.contextoActual.area?.id ?? solicitud.idAreaManual ?? 1,
        nombre: this.contextoActual.area?.nombre ?? 'Admisión',
      },
      solicitante: {
        id: this.contextoActual.persona?.id ?? 21,
        nombre: this.contextoActual.persona?.nombreVisible ?? 'Lic. Patricia Ramos',
      },
      asignadoA: null,
      equipo: equipoTicket,
      ipOrigen: this.contextoActual.ipOrigen,
      anexoContacto: this.contextoActual.area?.anexo ?? null,
      impacto: solicitud.impacto,
      urgencia: solicitud.urgencia,
      fechaCreacion: ahora,
      fechaLimiteResolucion: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      fechaAsignacion: null,
      fechaLimiteRespuesta: null,
      fechaRespuestaReal: null,
      fechaResolucionReal: null,
      fechaCierre: null,
    };

    return of(ticket).pipe(delay(50));
  }

  simularContexto(parcial: Partial<ContextoAtencion>): void {
    this.contextoActual = {
      ...this.contextoActual,
      ...parcial,
    };
  }

  restablecer(): void {
    this.contextoActual = { ...CONTEXTO_DEFAULT_MOCK };
  }
}
