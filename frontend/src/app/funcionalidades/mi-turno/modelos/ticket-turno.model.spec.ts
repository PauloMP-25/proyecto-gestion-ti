import { describe, it, expect } from 'vitest';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { RolUsuario } from '../../../nucleo/modelos/rol.enum';
import {
  TicketTurno,
  accionesDisponibles,
  compararUrgenciaTurno,
  pesoPrioridad,
} from './ticket-turno.model';

function fabricarTicket(parcial: Partial<TicketTurno> = {}): TicketTurno {
  const ahora = Date.now();
  return {
    id: 1,
    codigo: 'INC-2026-00001',
    titulo: 'Ticket de prueba',
    descripcion: 'Descripción de prueba',
    prioridad: Prioridad.P3_MEDIA,
    estado: EstadoTicket.NUEVO,
    nivelSoporte: NivelSoporte.N1,
    categoriaId: 1,
    categoriaNombre: 'Hardware',
    areaNombre: 'Admisión',
    solicitanteNombre: 'Juan Perez',
    anexo: '100',
    equipo: null,
    asignadoA: null,
    esMio: false,
    reabierto: false,
    fechaCreacionIso: new Date(ahora - 30 * 60000).toISOString(),
    sla: {
      inicioIso: new Date(ahora - 30 * 60000).toISOString(),
      limiteRespuestaIso: new Date(ahora + 30 * 60000).toISOString(),
      limiteResolucionIso: new Date(ahora + 90 * 60000).toISOString(),
      respuestaRealIso: null,
      estadoServidor: EstadoSla.A_TIEMPO,
      desfaseServidorMs: 0,
      fase: 'RESPUESTA',
    },
    ...parcial,
  };
}

describe('ticket-turno.model · Funciones puras', () => {
  describe('accionesDisponibles()', () => {
    it('debe devolver null y sin secundarias si el rol NO es PRACTICANTE', () => {
      const ticket = fabricarTicket({ estado: EstadoTicket.NUEVO });
      const resultadoAdmin = accionesDisponibles(ticket, RolUsuario.ADMINISTRADOR);
      const resultadoUser = accionesDisponibles(ticket, RolUsuario.USUARIO_FINAL);

      expect(resultadoAdmin.primaria).toBeNull();
      expect(resultadoAdmin.secundarias).toEqual([]);
      expect(resultadoUser.primaria).toBeNull();
      expect(resultadoUser.secundarias).toEqual([]);
    });

    it('para ticket NUEVO sin asignar P3/P4: primaria es TOMAR', () => {
      const ticketP3 = fabricarTicket({
        estado: EstadoTicket.NUEVO,
        prioridad: Prioridad.P3_MEDIA,
        asignadoA: null,
      });
      const res = accionesDisponibles(ticketP3, RolUsuario.PRACTICANTE);
      expect(res.primaria).toBe('TOMAR');
      expect(res.secundarias).toEqual([]);
    });

    it('para ticket NUEVO sin asignar P1/P2: primaria es TOMAR_Y_COMENZAR', () => {
      const ticketP1 = fabricarTicket({
        estado: EstadoTicket.NUEVO,
        prioridad: Prioridad.P1_CRITICA,
        asignadoA: null,
      });
      const res1 = accionesDisponibles(ticketP1, RolUsuario.PRACTICANTE);
      expect(res1.primaria).toBe('TOMAR_Y_COMENZAR');

      const ticketP2 = fabricarTicket({
        estado: EstadoTicket.NUEVO,
        prioridad: Prioridad.P2_ALTA,
        asignadoA: null,
      });
      const res2 = accionesDisponibles(ticketP2, RolUsuario.PRACTICANTE);
      expect(res2.primaria).toBe('TOMAR_Y_COMENZAR');
    });

    it('para ticket ASIGNADO o REABIERTO propio: primaria INICIAR y secundaria ESCALAR', () => {
      const ticketAsig = fabricarTicket({
        estado: EstadoTicket.ASIGNADO,
        esMio: true,
        asignadoA: { id: 2, nombre: 'Yo' },
      });
      const resAsig = accionesDisponibles(ticketAsig, RolUsuario.PRACTICANTE);
      expect(resAsig.primaria).toBe('INICIAR');
      expect(resAsig.secundarias).toEqual(['ESCALAR']);

      const ticketReab = fabricarTicket({
        estado: EstadoTicket.REABIERTO,
        esMio: true,
        reabierto: true,
        asignadoA: { id: 2, nombre: 'Yo' },
      });
      const resReab = accionesDisponibles(ticketReab, RolUsuario.PRACTICANTE);
      expect(resReab.primaria).toBe('INICIAR');
      expect(resReab.secundarias).toEqual(['ESCALAR']);
    });

    it('para ticket EN_PROCESO propio: primaria RESOLVER y secundaria ESCALAR', () => {
      const ticket = fabricarTicket({
        estado: EstadoTicket.EN_PROCESO,
        esMio: true,
        asignadoA: { id: 2, nombre: 'Yo' },
      });
      const res = accionesDisponibles(ticket, RolUsuario.PRACTICANTE);
      expect(res.primaria).toBe('RESOLVER');
      expect(res.secundarias).toEqual(['ESCALAR']);
    });

    it('para ticket asignado a otro técnico o en estado terminal: solo lectura', () => {
      const ticketAjeno = fabricarTicket({
        estado: EstadoTicket.EN_PROCESO,
        esMio: false,
        asignadoA: { id: 99, nombre: 'Otro' },
      });
      expect(accionesDisponibles(ticketAjeno, RolUsuario.PRACTICANTE).primaria).toBeNull();

      const ticketResuelto = fabricarTicket({
        estado: EstadoTicket.RESUELTO,
        esMio: true,
      });
      expect(accionesDisponibles(ticketResuelto, RolUsuario.PRACTICANTE).primaria).toBeNull();

      const ticketEscalado = fabricarTicket({
        estado: EstadoTicket.ESCALADO,
        esMio: true,
      });
      expect(accionesDisponibles(ticketEscalado, RolUsuario.PRACTICANTE).primaria).toBeNull();
    });
  });

  describe('compararUrgenciaTurno()', () => {
    const ahora = 1700000000000;

    it('en vista POR_TOMAR: ordena primero por prioridad (P1 antes que P4) y luego por antigüedad', () => {
      const t1 = fabricarTicket({
        prioridad: Prioridad.P1_CRITICA,
        fechaCreacionIso: new Date(ahora - 10000).toISOString(),
      });
      const t2 = fabricarTicket({
        prioridad: Prioridad.P3_MEDIA,
        fechaCreacionIso: new Date(ahora - 50000).toISOString(),
      });

      expect(compararUrgenciaTurno(t1, t2, ahora, 'POR_TOMAR')).toBeLessThan(0);

      // Misma prioridad: el más antiguo primero
      const tAntiguo = fabricarTicket({
        prioridad: Prioridad.P2_ALTA,
        fechaCreacionIso: new Date(ahora - 60000).toISOString(),
      });
      const tNuevo = fabricarTicket({
        prioridad: Prioridad.P2_ALTA,
        fechaCreacionIso: new Date(ahora - 10000).toISOString(),
      });
      expect(compararUrgenciaTurno(tAntiguo, tNuevo, ahora, 'POR_TOMAR')).toBeLessThan(0);
    });

    it('en vista EN_ATENCION: tickets vencidos van antes que tickets por vencer y a tiempo', () => {
      // Vencido
      const tVencido = fabricarTicket({
        prioridad: Prioridad.P3_MEDIA,
        sla: {
          inicioIso: new Date(ahora - 60000).toISOString(),
          limiteRespuestaIso: new Date(ahora - 1000).toISOString(), // vencido
          limiteResolucionIso: new Date(ahora + 60000).toISOString(),
          respuestaRealIso: null,
          estadoServidor: EstadoSla.INCUMPLIDO,
          desfaseServidorMs: 0,
          fase: 'RESPUESTA',
        },
      });

      // A tiempo
      const tATiempo = fabricarTicket({
        prioridad: Prioridad.P1_CRITICA,
        sla: {
          inicioIso: new Date(ahora - 10000).toISOString(),
          limiteRespuestaIso: new Date(ahora + 50000).toISOString(), // a tiempo
          limiteResolucionIso: new Date(ahora + 100000).toISOString(),
          respuestaRealIso: null,
          estadoServidor: EstadoSla.A_TIEMPO,
          desfaseServidorMs: 0,
          fase: 'RESPUESTA',
        },
      });

      expect(compararUrgenciaTurno(tVencido, tATiempo, ahora, 'EN_ATENCION')).toBeLessThan(0);
    });
  });

  describe('pesoPrioridad()', () => {
    it('asigna menor peso a mayor urgencia', () => {
      expect(pesoPrioridad(Prioridad.P1_CRITICA)).toBe(1);
      expect(pesoPrioridad(Prioridad.P2_ALTA)).toBe(2);
      expect(pesoPrioridad(Prioridad.P3_MEDIA)).toBe(3);
      expect(pesoPrioridad(Prioridad.P4_BAJA)).toBe(4);
    });
  });
});
