import { TestBed } from '@angular/core/testing';
import { AlertasTurnoService } from './alertas-turno.service';
import { TicketTurno } from '../modelos/ticket-turno.model';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../compartido/modelos/nivel-soporte.enum';

describe('AlertasTurnoService', () => {
  let service: AlertasTurnoService;

  const crearTicketPrueba = (
    id: number,
    codigo: string,
    prioridad: Prioridad,
    minutosRestantes: number,
    totalDuracionMinutos = 100
  ): TicketTurno => {
    const ahora = Date.now();
    const limiteMs = ahora + minutosRestantes * 60 * 1000;
    const inicioMs = limiteMs - totalDuracionMinutos * 60 * 1000;

    return {
      id,
      codigo,
      titulo: `Prueba ${codigo}`,
      descripcion: 'Descripción',
      categoriaId: 1,
      categoriaNombre: 'SISTEMAS',
      nivelSoporte: NivelSoporte.N1,
      prioridad,
      estado: EstadoTicket.EN_PROCESO,
      areaNombre: 'Emergencia',
      solicitanteNombre: 'Dra. Ana López',
      anexo: '102',
      equipo: null,
      fechaCreacionIso: new Date(inicioMs).toISOString(),
      asignadoA: { id: 10, nombre: 'Practicante' },
      esMio: true,
      reabierto: false,
      sla: {
        fase: 'RESOLUCION',
        inicioIso: new Date(inicioMs).toISOString(),
        limiteRespuestaIso: new Date(inicioMs + 15 * 60 * 1000).toISOString(),
        limiteResolucionIso: new Date(limiteMs).toISOString(),
        respuestaRealIso: new Date(inicioMs + 5 * 60 * 1000).toISOString(),
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
      },
    };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlertasTurnoService],
    });
    service = TestBed.inject(AlertasTurnoService);
    service.limpiarHistorial();
  });

  it('debe crearse correctamente con estado inicial online', () => {
    expect(service).toBeTruthy();
    expect(service.online()).toBe(true);
    expect(service.ultimoAnuncio()).toBeNull();
  });

  it('debe emitir anuncios manuales correctamente', () => {
    service.emitirAnuncio('Mensaje informativo', 'polite');
    const anuncio = service.ultimoAnuncio();
    expect(anuncio).not.toBeNull();
    expect(anuncio?.mensaje).toBe('Mensaje informativo');
    expect(anuncio?.tipo).toBe('polite');
  });

  it('debe registrar el estado inicial en la primera pasada sin emitir alerta de transición', () => {
    const ticket = crearTicketPrueba(1, 'TK-001', Prioridad.P2_ALTA, 80, 100);
    service.inspeccionarTransicionesSla([ticket]);
    expect(service.ultimoAnuncio()).toBeNull();
  });

  it('debe emitir anuncio polite cuando un ticket pasa de A_TIEMPO a ALERTA', () => {
    // 80 minutos de 100 = 80% restante -> A_TIEMPO
    const ticket1 = crearTicketPrueba(1, 'TK-001', Prioridad.P2_ALTA, 80, 100);
    service.inspeccionarTransicionesSla([ticket1]);
    expect(service.ultimoAnuncio()).toBeNull();

    // 10 minutos de 100 = 10% restante (<= 20% umbral) -> ALERTA
    const ticketAlerta = crearTicketPrueba(1, 'TK-001', Prioridad.P2_ALTA, 10, 100);
    service.inspeccionarTransicionesSla([ticketAlerta]);

    const anuncio = service.ultimoAnuncio();
    expect(anuncio).not.toBeNull();
    expect(anuncio?.tipo).toBe('polite');
    expect(anuncio?.mensaje).toContain('TK-001');
    expect(anuncio?.mensaje).toContain('por vencer');
  });

  it('debe emitir anuncio assertive de atención prioritaria cuando un ticket P1 pasa a INCUMPLIDO', () => {
    const ticketP1 = crearTicketPrueba(2, 'TK-CRITICO', Prioridad.P1_CRITICA, 50, 100);
    service.inspeccionarTransicionesSla([ticketP1]);

    // Tiempo negativo = vencido -> INCUMPLIDO
    const ticketVencido = crearTicketPrueba(2, 'TK-CRITICO', Prioridad.P1_CRITICA, -5, 100);
    service.inspeccionarTransicionesSla([ticketVencido]);

    const anuncio = service.ultimoAnuncio();
    expect(anuncio).not.toBeNull();
    expect(anuncio?.tipo).toBe('assertive');
    expect(anuncio?.mensaje).toContain('Atención prioritaria');
    expect(anuncio?.mensaje).toContain('TK-CRITICO');
  });

  it('debe emitir anuncio polite cuando un ticket no crítico pasa a INCUMPLIDO', () => {
    const ticketP3 = crearTicketPrueba(3, 'TK-MEDIA', Prioridad.P3_MEDIA, 50, 100);
    service.inspeccionarTransicionesSla([ticketP3]);

    const ticketVencido = crearTicketPrueba(3, 'TK-MEDIA', Prioridad.P3_MEDIA, -1, 100);
    service.inspeccionarTransicionesSla([ticketVencido]);

    const anuncio = service.ultimoAnuncio();
    expect(anuncio).not.toBeNull();
    expect(anuncio?.tipo).toBe('polite');
    expect(anuncio?.mensaje).toContain('TK-MEDIA');
    expect(anuncio?.mensaje).not.toContain('Atención prioritaria');
  });

  it('debe limpiar historial al invocar limpiarHistorial()', () => {
    service.emitirAnuncio('Test', 'polite');
    expect(service.ultimoAnuncio()).not.toBeNull();
    service.limpiarHistorial();
    expect(service.ultimoAnuncio()).toBeNull();
  });
});
