import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BandejaTurnoPage } from './bandeja-turno.page';
import { TurnoApi } from '../../servicios/turno.api';
import { RelojService } from '../../../../nucleo/servicios/reloj.service';
import { SondeoService } from '../../../../nucleo/servicios/sondeo.service';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../../compartido/modelos/nivel-soporte.enum';
import { EstadoSla } from '../../../../compartido/modelos/estado-sla.enum';
import { TicketTurno, ResumenTurno, ConsultaTurno } from '../../modelos/ticket-turno.model';
import { AlertasTurnoService } from '../../servicios/alertas-turno.service';

describe('BandejaTurnoPage (B2)', () => {
  let component: BandejaTurnoPage;
  let fixture: ComponentFixture<BandejaTurnoPage>;

  const resumenMock: ResumenTurno = {
    asignados: 3,
    porVencer: 1,
    vencidos: 0,
    resueltosHoy: 4,
    hayP1SinTomar: true,
    ahoraServidorIso: new Date().toISOString(),
  };

  const ticketsMock: TicketTurno[] = [
    {
      id: 101,
      codigo: 'INC-2026-00101',
      titulo: 'Sin conexión GalenHos en Emergencia',
      descripcion: 'Detalle de la incidencia',
      prioridad: Prioridad.P1_CRITICA,
      estado: EstadoTicket.EN_PROCESO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 1,
      categoriaNombre: 'Sistemas',
      areaNombre: 'Emergencia',
      solicitanteNombre: 'Dr. Flores',
      anexo: '2100',
      equipo: { id: 1, hostname: 'HSP-EMG-PC01', ip: '10.0.0.1', areaId: 1, area: 'Emergencia', tipo: 'PC' as any },
      asignadoA: { id: 2, nombre: 'Carlos Huamán' },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: new Date().toISOString(),
      sla: {
        inicioIso: new Date().toISOString(),
        limiteRespuestaIso: new Date().toISOString(),
        limiteResolucionIso: new Date(Date.now() + 60000).toISOString(),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESOLUCION',
      },
    },
    {
      id: 102,
      codigo: 'INC-2026-00102',
      titulo: 'Impresora térmica trabada',
      descripcion: 'Detalle de la impresora',
      prioridad: Prioridad.P2_ALTA,
      estado: EstadoTicket.NUEVO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 2,
      categoriaNombre: 'Hardware',
      areaNombre: 'Farmacia',
      solicitanteNombre: 'Lic. Pérez',
      anexo: '2200',
      equipo: null,
      asignadoA: null,
      esMio: false,
      reabierto: false,
      fechaCreacionIso: new Date().toISOString(),
      sla: {
        inicioIso: new Date().toISOString(),
        limiteRespuestaIso: new Date(Date.now() + 600000).toISOString(),
        limiteResolucionIso: new Date(Date.now() + 7200000).toISOString(),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
    },
    {
      id: 103,
      codigo: 'INC-2026-00103',
      titulo: 'Mouse no responde',
      descripcion: 'Detalle del mouse',
      prioridad: Prioridad.P3_MEDIA,
      estado: EstadoTicket.RESUELTO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 2,
      categoriaNombre: 'Hardware',
      areaNombre: 'Admisión',
      solicitanteNombre: 'Sr. Gómez',
      anexo: '2300',
      equipo: null,
      asignadoA: { id: 2, nombre: 'Carlos Huamán' },
      esMio: true,
      reabierto: false,
      fechaCreacionIso: new Date().toISOString(),
      sla: {
        inicioIso: new Date().toISOString(),
        limiteRespuestaIso: new Date().toISOString(),
        limiteResolucionIso: new Date().toISOString(),
        respuestaRealIso: new Date().toISOString(),
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'COMPLETADO',
      },
    },
  ];

  let turnoApiMock: {
    resumen: ReturnType<typeof vi.fn>;
    listar: ReturnType<typeof vi.fn>;
    tomar: ReturnType<typeof vi.fn>;
    iniciarAtencion: ReturnType<typeof vi.fn>;
    resolver: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    turnoApiMock = {
      resumen: vi.fn(() => of(resumenMock)),
      listar: vi.fn((c: ConsultaTurno) => {
        let filtrados = [...ticketsMock];
        if (c.vista === 'POR_TOMAR') {
          filtrados = filtrados.filter(t => t.estado === EstadoTicket.NUEVO);
        } else if (c.vista === 'EN_ATENCION') {
          filtrados = filtrados.filter(t => t.esMio && t.estado === EstadoTicket.EN_PROCESO);
        } else if (c.vista === 'HISTORIAL') {
          filtrados = filtrados.filter(t => t.estado === EstadoTicket.RESUELTO);
        }
        if (c.soloP1P2) {
          filtrados = filtrados.filter(t => t.prioridad === Prioridad.P1_CRITICA || t.prioridad === Prioridad.P2_ALTA);
        }
        return of({
          contenido: filtrados,
          totalElementos: filtrados.length,
          totalPaginas: 1,
          pagina: 0,
          tamano: 20,
        });
      }),
      tomar: vi.fn((id: number, payload: { iniciarAtencion: boolean }) => {
        const t = ticketsMock.find(x => x.id === id);
        return of({
          ...t!,
          estado: payload.iniciarAtencion ? EstadoTicket.EN_PROCESO : EstadoTicket.ASIGNADO,
          esMio: true,
        });
      }),
      iniciarAtencion: vi.fn((id: number) => {
        const t = ticketsMock.find(x => x.id === id);
        return of({ ...t!, estado: EstadoTicket.EN_PROCESO });
      }),
      resolver: vi.fn((id: number) => {
        const t = ticketsMock.find(x => x.id === id);
        return of({ ...t!, estado: EstadoTicket.RESUELTO, sla: { ...t!.sla, fase: 'COMPLETADO' as const } });
      }),
    };

    await TestBed.configureTestingModule({
      imports: [BandejaTurnoPage],
      providers: [
        provideRouter([]),
        { provide: TurnoApi, useValue: turnoApiMock },
        {
          provide: SondeoService,
          useValue: {
            crearSondeo: (fuente$: () => any) => fuente$(),
          },
        },
        RelojService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BandejaTurnoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar datos iniciales en la pestaña En atención', () => {
    expect(component).toBeTruthy();
    expect(component.vistaActual()).toBe('EN_ATENCION');
    expect(component.cargando()).toBe(false);
    expect(component.tickets().length).toBe(1);
    expect(component.tickets()[0].codigo).toBe('INC-2026-00101');
  });

  it('debe cambiar de pestaña a POR_TOMAR y cargar tickets nuevos sin asignar', () => {
    component.cambiarVista('POR_TOMAR');
    fixture.detectChanges();

    expect(component.vistaActual()).toBe('POR_TOMAR');
    expect(component.tickets().length).toBe(1);
    expect(component.tickets()[0].codigo).toBe('INC-2026-00102');
  });

  it('debe cambiar de pestaña a HISTORIAL y cargar tickets resueltos', () => {
    component.cambiarVista('HISTORIAL');
    fixture.detectChanges();

    expect(component.vistaActual()).toBe('HISTORIAL');
    expect(component.tickets().length).toBe(1);
    expect(component.tickets()[0].codigo).toBe('INC-2026-00103');
  });

  it('debe filtrar solo P1 y P2 al activar el chip de urgentes', () => {
    component.cambiarVista('POR_TOMAR');
    fixture.detectChanges();

    component.toggleSoloUrgentes();
    fixture.detectChanges();

    expect(component.soloUrgentes()).toBe(true);
    for (const t of component.tickets()) {
      expect([Prioridad.P1_CRITICA, Prioridad.P2_ALTA]).toContain(t.prioridad);
    }
  });

  it('debe tomar un ticket de la bolsa POR_TOMAR correctamente', () => {
    component.cambiarVista('POR_TOMAR');
    fixture.detectChanges();

    const ticketPorTomar = component.tickets()[0];
    expect(ticketPorTomar).toBeTruthy();

    const eventoFicticio = new MouseEvent('click');
    const spyEvent = vi.spyOn(eventoFicticio, 'stopPropagation');

    const accion = component.obtenerAccionPrimaria(ticketPorTomar);
    expect(accion).toBe('TOMAR_Y_COMENZAR');

    component.ejecutarAccion(ticketPorTomar, accion!, eventoFicticio);
    expect(spyEvent).toHaveBeenCalled();
    expect(turnoApiMock.tomar).toHaveBeenCalledWith(ticketPorTomar.id, { iniciarAtencion: true });

    fixture.detectChanges();
    expect(component.mensajeExito()).toContain('asignado a su turno');
  });

  it('debe manejar conflicto 409 mostrando mensaje específico de conflicto', () => {
    turnoApiMock.tomar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' }))
    );

    const ticketFake = ticketsMock[1];
    const evt = new MouseEvent('click');
    component.ejecutarAccion(ticketFake, 'TOMAR', evt);
    fixture.detectChanges();

    expect(component.mensajeAlerta()).toContain('Otro técnico ya tomó este ticket');
  });

  it('debe abrir y cerrar el diálogo de resolución para un ticket en proceso', () => {
    const ticketEnProceso = component.tickets()[0];
    expect(ticketEnProceso.estado).toBe(EstadoTicket.EN_PROCESO);

    const evt = new MouseEvent('click');
    component.ejecutarAccion(ticketEnProceso, 'RESOLVER', evt);
    fixture.detectChanges();

    expect(component.ticketParaResolver()).toEqual(ticketEnProceso);

    // Cancelar
    component.cancelarResolucion();
    fixture.detectChanges();
    expect(component.ticketParaResolver()).toBeNull();
  });

  it('debe mostrar el banner de modo sin conexión cuando AlertasTurnoService.online() es false', () => {
    const alertas = TestBed.inject(AlertasTurnoService);
    alertas.online.set(false);
    fixture.detectChanges();

    const bannerOffline = fixture.nativeElement.querySelector('.mensaje-banner--offline');
    expect(bannerOffline).not.toBeNull();
    expect(bannerOffline.textContent).toContain('Modo sin conexión');
  });

  it('debe renderizar anuncios accesibles en las regiones aria-live', () => {
    const alertas = TestBed.inject(AlertasTurnoService);
    alertas.emitirAnuncio('Ticket urgente por vencer', 'polite');
    fixture.detectChanges();

    const regionesLive = fixture.nativeElement.querySelectorAll('.sr-only');
    expect(regionesLive.length).toBeGreaterThanOrEqual(2);

    const textoLive = Array.from(regionesLive).map((el: any) => el.textContent).join(' ');
    expect(textoLive).toContain('Ticket urgente por vencer');
  });
});
