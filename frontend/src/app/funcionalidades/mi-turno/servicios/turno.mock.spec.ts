import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TurnoMock, TECNICO_SESION_MOCK } from './turno.mock';
import { mapearTicketTurno } from './turno.http';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { TicketTurnoDto } from '../modelos/dtos';

describe('TurnoMock · Servicio reactivo en memoria', () => {
  let mock: TurnoMock;

  beforeEach(() => {
    mock = new TurnoMock();
  });

  it('resumen() devuelve contadores coherentes y detecta si hay P1 sin tomar', async () => {
    const resumen = await firstValueFrom(mock.resumen());
    expect(resumen.asignados).toBeGreaterThanOrEqual(1);
    expect(resumen.hayP1SinTomar).toBe(true); // INC-2026-00301 es P1 nuevo sin asignar
    expect(typeof resumen.ahoraServidorIso).toBe('string');
  });

  it('listar(POR_TOMAR) devuelve solo tickets NUEVOS sin asignar', async () => {
    const pagina = await firstValueFrom(mock.listar({ vista: 'POR_TOMAR', pagina: 0, tamano: 20 }));
    expect(pagina.contenido.length).toBeGreaterThanOrEqual(1);
    for (const t of pagina.contenido) {
      expect(t.estado).toBe(EstadoTicket.NUEVO);
      expect(t.asignadoA).toBeNull();
    }
  });

  it('listar(EN_ATENCION) devuelve solo tickets asignados a mí activos', async () => {
    const pagina = await firstValueFrom(mock.listar({ vista: 'EN_ATENCION', pagina: 0, tamano: 20 }));
    expect(pagina.contenido.length).toBeGreaterThanOrEqual(1);
    for (const t of pagina.contenido) {
      expect(t.esMio).toBe(true);
      expect([EstadoTicket.ASIGNADO, EstadoTicket.EN_PROCESO, EstadoTicket.REABIERTO]).toContain(t.estado);
    }
  });

  it('listar(HISTORIAL) devuelve tickets gestionados por mí resueltos, cerrados o escalados', async () => {
    const pagina = await firstValueFrom(mock.listar({ vista: 'HISTORIAL', pagina: 0, tamano: 20 }));
    expect(pagina.contenido.length).toBeGreaterThanOrEqual(1);
    for (const t of pagina.contenido) {
      expect(t.esMio).toBe(true);
      expect([EstadoTicket.RESUELTO, EstadoTicket.CERRADO, EstadoTicket.ESCALADO]).toContain(t.estado);
    }
  });

  it('tomar(id, false) asigna el ticket a sí mismo y pasa a ASIGNADO', async () => {
    // Ticket 305 es P4 NUEVO sin asignar
    const tomado = await firstValueFrom(mock.tomar(305, { iniciarAtencion: false }));
    expect(tomado.estado).toBe(EstadoTicket.ASIGNADO);
    expect(tomado.esMio).toBe(true);
    expect(tomado.asignadoA?.id).toBe(TECNICO_SESION_MOCK.id);

    // Debe salir de POR_TOMAR y aparecer en EN_ATENCION
    const porTomar = await firstValueFrom(mock.listar({ vista: 'POR_TOMAR', pagina: 0, tamano: 20 }));
    expect(porTomar.contenido.some(t => t.id === 305)).toBe(false);

    const enAtencion = await firstValueFrom(mock.listar({ vista: 'EN_ATENCION', pagina: 0, tamano: 20 }));
    expect(enAtencion.contenido.some(t => t.id === 305)).toBe(true);
  });

  it('tomar(id, true) pasa el ticket directo a EN_PROCESO con fase RESOLUCION', async () => {
    // Ticket 301 es P1 NUEVO sin asignar
    const tomado = await firstValueFrom(mock.tomar(301, { iniciarAtencion: true }));
    expect(tomado.estado).toBe(EstadoTicket.EN_PROCESO);
    expect(tomado.sla.fase).toBe('RESOLUCION');
    expect(tomado.esMio).toBe(true);
  });

  it('tomar(id) sobre un ticket ya asignado a otro técnico simula error 409 Conflicto', async () => {
    // Ticket 310 está asignado a Juan Pérez (otro técnico)
    await expect(firstValueFrom(mock.tomar(310, { iniciarAtencion: false })))
      .rejects.toSatisfy((e: unknown) => {
        return e instanceof HttpErrorResponse && e.status === 409;
      });
  });

  it('iniciarAtencion(id) pasa un ticket ASIGNADO a EN_PROCESO y fase RESOLUCION', async () => {
    // Ticket 290 es P3 ASIGNADO propio
    const iniciado = await firstValueFrom(mock.iniciarAtencion(290));
    expect(iniciado.estado).toBe(EstadoTicket.EN_PROCESO);
    expect(iniciado.sla.fase).toBe('RESOLUCION');
  });

  it('resolver(id, payload) pasa el ticket a RESUELTO y fase COMPLETADO', async () => {
    // Ticket 295 está EN_PROCESO
    const resuelto = await firstValueFrom(mock.resolver(295, {
      diagnostico: 'Rollo de papel trabado en la cuchilla de corte.',
      accionRealizada: 'Se desmontó la tapa, se limpió la guillotina y se colocó nuevo rollo.',
      tipoSolucion: 'DEFINITIVA',
    }));

    expect(resuelto.estado).toBe(EstadoTicket.RESUELTO);
    expect(resuelto.sla.fase).toBe('COMPLETADO');

    // Debe desaparecer de EN_ATENCION y aparecer en HISTORIAL
    const enAtencion = await firstValueFrom(mock.listar({ vista: 'EN_ATENCION', pagina: 0, tamano: 20 }));
    expect(enAtencion.contenido.some(t => t.id === 295)).toBe(false);

    const historial = await firstValueFrom(mock.listar({ vista: 'HISTORIAL', pagina: 0, tamano: 20 }));
    expect(historial.contenido.some(t => t.id === 295)).toBe(true);
  });

  it('escalar(id, payload) pasa el ticket a ESCALADO con N2 y fase COMPLETADO', async () => {
    // Ticket 288 está EN_PROCESO
    const escalado = await firstValueFrom(mock.escalar(288, {
      motivo: 'Falla en la tarjeta de red interna del monitor de telemetría.',
    }));

    expect(escalado.estado).toBe(EstadoTicket.ESCALADO);
    expect(escalado.nivelSoporte).toBe(NivelSoporte.N2);
    expect(escalado.sla.fase).toBe('COMPLETADO');

    // Debe salir de EN_ATENCION y aparecer en HISTORIAL
    const enAtencion = await firstValueFrom(mock.listar({ vista: 'EN_ATENCION', pagina: 0, tamano: 20 }));
    expect(enAtencion.contenido.some(t => t.id === 288)).toBe(false);

    const historial = await firstValueFrom(mock.listar({ vista: 'HISTORIAL', pagina: 0, tamano: 20 }));
    expect(historial.contenido.some(t => t.id === 288)).toBe(true);
  });
});

describe('mapearTicketTurno · Mapper puro', () => {
  it('mapea correctamente un DTO completo a TicketTurno con fallbacks seguros', () => {
    const dto: TicketTurnoDto = {
      id: 500,
      codigo: 'INC-2026-00500',
      titulo: 'Falla de prueba',
      descripcion: 'Detalle de prueba',
      prioridad: 'P1_CRITICA',
      estado: 'EN_PROCESO',
      nivelSoporte: 'N1',
      categoriaId: 10,
      categoriaNombre: 'Hardware',
      areaNombre: 'Admisión',
      solicitanteNombre: 'Ana Torres',
      anexo: '101',
      equipo: {
        id: 5,
        hostname: 'HSP-PC01',
        ip: '10.0.0.1',
        areaId: 2,
        area: 'Admisión',
        tipo: 'PC',
      },
      asignadoA: {
        id: 2,
        nombre: 'Carlos H.',
      },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: '2026-11-11T12:00:00Z',
      slaVista: {
        inicioIso: '2026-11-11T12:00:00Z',
        limiteRespuestaIso: '2026-11-11T12:15:00Z',
        limiteResolucionIso: '2026-11-11T14:00:00Z',
        fase: 'RESOLUCION',
      },
    };

    const modelo = mapearTicketTurno(dto);
    expect(modelo.id).toBe(500);
    expect(modelo.codigo).toBe('INC-2026-00500');
    expect(modelo.prioridad).toBe(Prioridad.P1_CRITICA);
    expect(modelo.estado).toBe(EstadoTicket.EN_PROCESO);
    expect(modelo.esMio).toBe(true);
    expect(modelo.sla.fase).toBe('RESOLUCION');
    expect(modelo.equipo?.hostname).toBe('HSP-PC01');
  });
});
