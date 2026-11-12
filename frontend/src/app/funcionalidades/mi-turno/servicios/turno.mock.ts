import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { calcularSla } from '../../../compartido/utilidades/calculo-sla';
import { conLatencia, paginar } from '../../../compartido/utilidades/mock-util';
import {
  ResolverTicketPayload,
  EscalarTicketPayload,
} from '../../../compartido/modelos/dialogos-acciones.model';
import {
  TicketTurno,
  ResumenTurno,
  ConsultaTurno,
  TomarTicketPayload,
  compararUrgenciaTurno,
} from '../modelos/ticket-turno.model';
import { TurnoApi } from './turno.api';

export const TECNICO_SESION_MOCK = {
  id: 2,
  nombre: 'Carlos Huamán (Practicante)',
};

@Injectable()
export class TurnoMock extends TurnoApi {
  private tickets: TicketTurno[] = crearTicketsTurnoMock();

  resumen(): Observable<ResumenTurno> {
    return conLatencia(() => {
      const ahoraMs = Date.now();
      const misActivos = this.tickets.filter(
        t => t.esMio && (t.estado === EstadoTicket.ASIGNADO || t.estado === EstadoTicket.EN_PROCESO || t.estado === EstadoTicket.REABIERTO)
      );

      let porVencer = 0;
      let vencidos = 0;

      for (const t of misActivos) {
        const sla = calcularSla(t.sla, ahoraMs);
        if (sla.estado === EstadoSla.ALERTA) {
          porVencer++;
        } else if (sla.estado === EstadoSla.INCUMPLIDO) {
          vencidos++;
        }
      }

      const resueltosHoy = this.tickets.filter(
        t => t.esMio && (t.estado === EstadoTicket.RESUELTO || t.estado === EstadoTicket.CERRADO)
      ).length;

      const hayP1SinTomar = this.tickets.some(
        t => t.estado === EstadoTicket.NUEVO && t.prioridad === Prioridad.P1_CRITICA && !t.asignadoA
      );

      return {
        asignados: misActivos.length,
        porVencer,
        vencidos,
        resueltosHoy,
        hayP1SinTomar,
        ahoraServidorIso: new Date(ahoraMs).toISOString(),
      };
    });
  }

  listar(c: ConsultaTurno): Observable<Pagina<TicketTurno>> {
    return conLatencia(() => {
      const ahoraMs = Date.now();
      let resultado = [...this.tickets];

      // 1. Filtrar por vista/pestaña
      if (c.vista === 'POR_TOMAR') {
        resultado = resultado.filter(
          t => t.estado === EstadoTicket.NUEVO && (!t.asignadoA || !t.asignadoA.id)
        );
      } else if (c.vista === 'EN_ATENCION') {
        resultado = resultado.filter(
          t => t.esMio && (t.estado === EstadoTicket.ASIGNADO || t.estado === EstadoTicket.EN_PROCESO || t.estado === EstadoTicket.REABIERTO)
        );
      } else if (c.vista === 'HISTORIAL') {
        resultado = resultado.filter(
          t => t.esMio && (t.estado === EstadoTicket.RESUELTO || t.estado === EstadoTicket.CERRADO || t.estado === EstadoTicket.ESCALADO)
        );
      }

      // 2. Filtro rápido solo P1/P2
      if (c.soloP1P2) {
        resultado = resultado.filter(
          t => t.prioridad === Prioridad.P1_CRITICA || t.prioridad === Prioridad.P2_ALTA
        );
      }

      // 3. Filtro por texto
      if (c.texto && c.texto.trim()) {
        const term = c.texto.trim().toLowerCase();
        resultado = resultado.filter(t =>
          t.codigo.toLowerCase().includes(term) ||
          t.titulo.toLowerCase().includes(term) ||
          t.descripcion.toLowerCase().includes(term) ||
          t.areaNombre.toLowerCase().includes(term) ||
          (t.equipo?.hostname && t.equipo.hostname.toLowerCase().includes(term)) ||
          (t.equipo?.ip && t.equipo.ip.includes(term))
        );
      }

      // 4. Orden estricto según la vista
      resultado.sort((a, b) => compararUrgenciaTurno(a, b, ahoraMs, c.vista));

      return paginar(structuredClone(resultado), c.pagina, c.tamano);
    });
  }

  obtener(id: number): Observable<TicketTurno> {
    return conLatencia(() => {
      const ticket = this.tickets.find(t => t.id === id);
      if (!ticket) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Ticket no encontrado' });
      }
      return structuredClone(ticket);
    });
  }

  tomar(id: number, p: TomarTicketPayload): Observable<TicketTurno> {
    return conLatencia(() => {
      const ticket = this.tickets.find(t => t.id === id);
      if (!ticket) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Ticket no encontrado' });
      }

      // Conflicto si otro técnico ya tomó el ticket
      if (ticket.asignadoA && !ticket.esMio) {
        throw new HttpErrorResponse({
          status: 409,
          statusText: 'Conflicto: Otro técnico ya tomó este ticket',
        });
      }

      ticket.asignadoA = { ...TECNICO_SESION_MOCK };
      ticket.esMio = true;

      if (p.iniciarAtencion) {
        ticket.estado = EstadoTicket.EN_PROCESO;
        ticket.sla.fase = 'RESOLUCION';
        ticket.sla.respuestaRealIso = new Date().toISOString();
      } else {
        ticket.estado = EstadoTicket.ASIGNADO;
      }

      return structuredClone(ticket);
    });
  }

  iniciarAtencion(id: number): Observable<TicketTurno> {
    return conLatencia(() => {
      const ticket = this.tickets.find(t => t.id === id);
      if (!ticket) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Ticket no encontrado' });
      }

      ticket.estado = EstadoTicket.EN_PROCESO;
      ticket.sla.fase = 'RESOLUCION';
      ticket.sla.respuestaRealIso = new Date().toISOString();
      return structuredClone(ticket);
    });
  }

  resolver(id: number, _p: ResolverTicketPayload): Observable<TicketTurno> {
    return conLatencia(() => {
      const ticket = this.tickets.find(t => t.id === id);
      if (!ticket) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Ticket no encontrado' });
      }

      ticket.estado = EstadoTicket.RESUELTO;
      ticket.sla.fase = 'COMPLETADO';
      return structuredClone(ticket);
    });
  }

  escalar(id: number, _p: EscalarTicketPayload): Observable<TicketTurno> {
    return conLatencia(() => {
      const ticket = this.tickets.find(t => t.id === id);
      if (!ticket) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Ticket no encontrado' });
      }

      ticket.estado = EstadoTicket.ESCALADO;
      ticket.nivelSoporte = NivelSoporte.N2;
      ticket.sla.fase = 'COMPLETADO';
      return structuredClone(ticket);
    });
  }

  /** Permite reiniciar el almacén a su estado original (útil en pruebas) */
  reiniciar(tickets?: TicketTurno[]): void {
    this.tickets = tickets ? structuredClone(tickets) : crearTicketsTurnoMock();
  }
}

/**
 * Fábrica dinámica de tickets de prueba para Mi Turno.
 * Genera límites relativos al parámetro `ahora` para garantizar la presencia de:
 * - P1 NUEVO en bolsa común (verde a ámbar pronto)
 * - P2 EN_PROCESO propio (ámbar / por vencer)
 * - P1 EN_PROCESO propio (rojo / vencido)
 * - P3 ASIGNADO propio (a tiempo)
 * - P3 REABIERTO propio (a tiempo)
 * - P2 ESCALADO a Nivel 2
 * - P3 RESUELTO hoy
 * - P4 NUEVO en bolsa común
 * - P2 EN_PROCESO asignado a otro técnico (para probar 409 y solo lectura)
 */
export function crearTicketsTurnoMock(ahora = Date.now()): TicketTurno[] {
  const min = (m: number) => new Date(ahora + m * 60_000).toISOString();
  const haceMin = (m: number) => new Date(ahora - m * 60_000).toISOString();

  return [
    {
      id: 301,
      codigo: 'INC-2026-00301',
      titulo: 'Caída de conexión GalenHos en Emergencia',
      descripcion: 'El sistema GalenHos no conecta con la base de datos en los 4 consultorios de Emergencia. Pacientes esperando triaje.',
      prioridad: Prioridad.P1_CRITICA,
      estado: EstadoTicket.NUEVO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 1,
      categoriaNombre: 'Sistemas Hospitalarios',
      areaNombre: 'Emergencia General',
      solicitanteNombre: 'Dr. Manuel Vargas',
      anexo: '2150',
      equipo: {
        id: 10,
        hostname: 'HSP-EMG-SRV01',
        ip: '10.20.30.10',
        areaId: 1,
        area: 'Emergencia General',
        tipo: 'SERVIDOR' as any,
      },
      asignadoA: null,
      esMio: false,
      reabierto: false,
      fechaCreacionIso: haceMin(6),
      sla: {
        inicioIso: haceMin(6),
        limiteRespuestaIso: min(9), // Restan 9 minutos (total 15 min -> 60% restante, verde -> ámbar pronto)
        limiteResolucionIso: min(114),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
    },
    {
      id: 295,
      codigo: 'INC-2026-00295',
      titulo: 'Impresora térmica de recetas no responde en Farmacia',
      descripcion: 'La impresora EPSON de Farmacia Central dejó de imprimir tras un cambio de rollo de papel. Se acumulan recetas.',
      prioridad: Prioridad.P2_ALTA,
      estado: EstadoTicket.EN_PROCESO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 2,
      categoriaNombre: 'Hardware / Impresoras',
      areaNombre: 'Farmacia Central',
      solicitanteNombre: 'Lic. Patricia Solís',
      anexo: '2340',
      equipo: {
        id: 14,
        hostname: 'HSP-FAR-IMP02',
        ip: '10.20.30.55',
        areaId: 2,
        area: 'Farmacia Central',
        tipo: 'IMPRESORA' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: haceMin(116),
      sla: {
        inicioIso: haceMin(116),
        limiteRespuestaIso: haceMin(90),
        limiteResolucionIso: min(4), // Restan solo 4 minutos de 120 (3.3% -> ALERTA/Ámbar)
        respuestaRealIso: haceMin(90),
        estadoServidor: EstadoSla.ALERTA,
        desfaseServidorMs: 0,
        fase: 'RESOLUCION',
      },
    },
    {
      id: 288,
      codigo: 'INC-2026-00288',
      titulo: 'Monitor multiparámetro no transmite a estación central UCI',
      descripcion: 'Cama 04 de UCI de Adultos perdió enlace de telemetría de signos vitales. Alerta visual activada en el monitor local.',
      prioridad: Prioridad.P1_CRITICA,
      estado: EstadoTicket.EN_PROCESO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 1,
      categoriaNombre: 'Equipos Asistenciales',
      areaNombre: 'UCI Adultos',
      solicitanteNombre: 'Dra. Carmen Quispe',
      anexo: '2410',
      equipo: {
        id: 22,
        hostname: 'HSP-UCI-MON04',
        ip: '10.20.40.14',
        areaId: 3,
        area: 'UCI Adultos',
        tipo: 'MEDICO' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: haceMin(132),
      sla: {
        inicioIso: haceMin(132),
        limiteRespuestaIso: haceMin(120),
        limiteResolucionIso: haceMin(12), // Vencido hace 12 minutos (INCUMPLIDO/Rojo)
        respuestaRealIso: haceMin(120),
        estadoServidor: EstadoSla.INCUMPLIDO,
        desfaseServidorMs: 0,
        fase: 'RESOLUCION',
      },
    },
    {
      id: 290,
      codigo: 'INC-2026-00290',
      titulo: 'Lector biométrico de huella no reconoce a médicos',
      descripcion: 'En Consultorio Externo 12 el lector DigitalPersona parpadea en rojo y no autentica la firma digital de las recetas.',
      prioridad: Prioridad.P3_MEDIA,
      estado: EstadoTicket.ASIGNADO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 2,
      categoriaNombre: 'Hardware / Periféricos',
      areaNombre: 'Consultorios Externos',
      solicitanteNombre: 'Dr. Roberto Chiroque',
      anexo: '2280',
      equipo: {
        id: 31,
        hostname: 'HSP-CXT-PC12',
        ip: '10.20.30.82',
        areaId: 4,
        area: 'Consultorios Externos',
        tipo: 'PC' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: haceMin(15),
      sla: {
        inicioIso: haceMin(15),
        limiteRespuestaIso: min(45), // Restan 45 minutos (A_TIEMPO/Verde)
        limiteResolucionIso: min(225),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
    },
    {
      id: 284,
      codigo: 'INC-2026-00284',
      titulo: 'Reapertura: Cuenta SIS bloqueada de asistente social',
      descripcion: 'El usuario se desbloqueó pero al ingresar el código de verificación SMS vuelve a salir error de credenciales.',
      prioridad: Prioridad.P3_MEDIA,
      estado: EstadoTicket.REABIERTO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 3,
      categoriaNombre: 'Cuentas y Accesos',
      areaNombre: 'Servicio Social',
      solicitanteNombre: 'Lic. Elena Ramos',
      anexo: '2190',
      equipo: {
        id: 35,
        hostname: 'HSP-SOC-PC01',
        ip: '10.20.30.91',
        areaId: 5,
        area: 'Servicio Social',
        tipo: 'PC' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: true,
      fechaCreacionIso: haceMin(30),
      sla: {
        inicioIso: haceMin(30),
        limiteRespuestaIso: min(30), // A_TIEMPO
        limiteResolucionIso: min(210),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
    },
    {
      id: 270,
      codigo: 'INC-2026-00270',
      titulo: 'Caída de enlace en switch troncal de Hospitalización 2',
      descripcion: 'Se verificó daño en el módulo SFP de fibra óptica que conecta el rack del piso 2 al datacenter. Requiere intervención de redes nivel 2.',
      prioridad: Prioridad.P2_ALTA,
      estado: EstadoTicket.ESCALADO,
      nivelSoporte: NivelSoporte.N2,
      categoriaId: 4,
      categoriaNombre: 'Redes y Comunicaciones',
      areaNombre: 'Hospitalización 2do Piso',
      solicitanteNombre: 'Lic. Maritza Cornejo',
      anexo: '2501',
      equipo: {
        id: 8,
        hostname: 'HSP-SW-P02',
        ip: '10.20.10.12',
        areaId: 6,
        area: 'Hospitalización 2do Piso',
        tipo: 'RED' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: haceMin(240),
      sla: {
        inicioIso: haceMin(240),
        limiteRespuestaIso: haceMin(210),
        limiteResolucionIso: haceMin(120),
        respuestaRealIso: haceMin(210),
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'COMPLETADO',
      },
    },
    {
      id: 265,
      codigo: 'INC-2026-00265',
      titulo: 'Mouse USB no responde en Admisión General',
      descripcion: 'Se realizó reemplazo de mouse USB por uno nuevo del almacén de TI. Equipo probado y operativo.',
      prioridad: Prioridad.P3_MEDIA,
      estado: EstadoTicket.RESUELTO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 2,
      categoriaNombre: 'Hardware / Periféricos',
      areaNombre: 'Admisión General',
      solicitanteNombre: 'Sr. Jorge Palomino',
      anexo: '2110',
      equipo: {
        id: 11,
        hostname: 'HSP-ADM-PC03',
        ip: '10.20.30.22',
        areaId: 7,
        area: 'Admisión General',
        tipo: 'PC' as any,
      },
      asignadoA: { ...TECNICO_SESION_MOCK },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: haceMin(180),
      sla: {
        inicioIso: haceMin(180),
        limiteRespuestaIso: haceMin(150),
        limiteResolucionIso: haceMin(60),
        respuestaRealIso: haceMin(150),
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'COMPLETADO',
      },
    },
    {
      id: 305,
      codigo: 'INC-2026-00305',
      titulo: 'Punto de red suelto en Jefatura de Enfermería',
      descripcion: 'El conector RJ45 hembra de la pared tiene el seguro roto y se desconecta al mover el escritorio.',
      prioridad: Prioridad.P4_BAJA,
      estado: EstadoTicket.NUEVO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 4,
      categoriaNombre: 'Redes y Comunicaciones',
      areaNombre: 'Jefatura de Enfermería',
      solicitanteNombre: 'Lic. Gloria Valdivia',
      anexo: '2315',
      equipo: null,
      asignadoA: null,
      esMio: false,
      reabierto: false,
      fechaCreacionIso: haceMin(20),
      sla: {
        inicioIso: haceMin(20),
        limiteRespuestaIso: min(100),
        limiteResolucionIso: min(460),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
    },
    {
      id: 310,
      codigo: 'INC-2026-00310',
      titulo: 'Error de certificado digital en Laboratorio Clínico',
      descripcion: 'El sistema de validación hematológica no valida la firma electrónica de los resultados.',
      prioridad: Prioridad.P2_ALTA,
      estado: EstadoTicket.EN_PROCESO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 1,
      categoriaNombre: 'Sistemas Hospitalarios',
      areaNombre: 'Laboratorio Clínico',
      solicitanteNombre: 'Dra. Silvia Bravo',
      anexo: '2240',
      equipo: {
        id: 40,
        hostname: 'HSP-LAB-PC02',
        ip: '10.20.30.70',
        areaId: 8,
        area: 'Laboratorio Clínico',
        tipo: 'PC' as any,
      },
      asignadoA: {
        id: 5,
        nombre: 'Juan Pérez (Técnico N1)',
      },
      esMio: false,
      reabierto: false,
      fechaCreacionIso: haceMin(40),
      sla: {
        inicioIso: haceMin(40),
        limiteRespuestaIso: haceMin(10),
        limiteResolucionIso: min(80),
        respuestaRealIso: haceMin(10),
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESOLUCION',
      },
    },
  ];
}
