import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FichaAtencionPage } from './ficha-atencion.page';
import { TurnoApi } from '../../servicios/turno.api';
import { RelojService } from '../../../../nucleo/servicios/reloj.service';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../../compartido/modelos/nivel-soporte.enum';
import { EstadoSla } from '../../../../compartido/modelos/estado-sla.enum';
import { TicketTurno } from '../../modelos/ticket-turno.model';

describe('FichaAtencionPage (B4, B5, B6)', () => {
  let component: FichaAtencionPage;
  let fixture: ComponentFixture<FichaAtencionPage>;

  const ticketMock: TicketTurno = {
    id: 201,
    codigo: 'INC-2026-00201',
    titulo: 'Sin conexión a GalenHos en Triaje',
    descripcion: 'El sistema GalenHos no conecta con la base de datos tras corte de energía.',
    prioridad: Prioridad.P1_CRITICA,
    estado: EstadoTicket.EN_PROCESO,
    nivelSoporte: NivelSoporte.N1,
    categoriaId: 1,
    categoriaNombre: 'Sistemas Hospitalarios',
    areaNombre: 'Triaje de Emergencia',
    solicitanteNombre: 'Dr. Alejandro Ramos',
    anexo: '2210',
    equipo: {
      id: 12,
      hostname: 'HSP-ADM-01',
      ip: '10.20.30.15',
      areaId: 1,
      area: 'Triaje de Emergencia',
      tipo: 'PC' as any,
    },
    asignadoA: { id: 2, nombre: 'Carlos Huamán (Practicante)' },
    esMio: true,
    reabierto: false,
    fechaCreacionIso: new Date(Date.now() - 30 * 60000).toISOString(),
    sla: {
      inicioIso: new Date(Date.now() - 30 * 60000).toISOString(),
      limiteRespuestaIso: new Date(Date.now() - 15 * 60000).toISOString(),
      limiteResolucionIso: new Date(Date.now() + 60 * 60000).toISOString(),
      respuestaRealIso: new Date(Date.now() - 15 * 60000).toISOString(),
      estadoServidor: EstadoSla.A_TIEMPO,
      desfaseServidorMs: 0,
      fase: 'RESOLUCION',
    },
  };

  let turnoApiMock: {
    obtener: ReturnType<typeof vi.fn>;
    tomar: ReturnType<typeof vi.fn>;
    iniciarAtencion: ReturnType<typeof vi.fn>;
    resolver: ReturnType<typeof vi.fn>;
    escalar: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    turnoApiMock = {
      obtener: vi.fn(() => of(ticketMock)),
      tomar: vi.fn((id: number, payload: { iniciarAtencion: boolean }) =>
        of({
          ...ticketMock,
          estado: payload.iniciarAtencion ? EstadoTicket.EN_PROCESO : EstadoTicket.ASIGNADO,
        })
      ),
      iniciarAtencion: vi.fn((id: number) =>
        of({ ...ticketMock, estado: EstadoTicket.EN_PROCESO, sla: { ...ticketMock.sla, fase: 'RESOLUCION' as const } })
      ),
      resolver: vi.fn((id: number, payload: any) =>
        of({
          ...ticketMock,
          estado: EstadoTicket.RESUELTO,
          sla: { ...ticketMock.sla, fase: 'COMPLETADO' as const },
        })
      ),
      escalar: vi.fn((id: number, payload: any) =>
        of({
          ...ticketMock,
          estado: EstadoTicket.ESCALADO,
          nivelSoporte: NivelSoporte.N2,
          sla: { ...ticketMock.sla, fase: 'COMPLETADO' as const },
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [FichaAtencionPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '201' : null),
              },
              queryParamMap: {
                get: (key: string) => (key === 'solucionId' ? '501' : null),
              },
            },
          },
        },
        { provide: TurnoApi, useValue: turnoApiMock },
        RelojService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FichaAtencionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar el detalle del ticket correctamente (B4)', () => {
    expect(component).toBeTruthy();
    expect(component.cargando()).toBe(false);
    expect(component.ticket()?.codigo).toBe('INC-2026-00201');
    expect(component.solucionSugeridaId()).toBe(501);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('INC-2026-00201');
    expect(el.textContent).toContain('Dr. Alejandro Ramos');
    expect(el.textContent).toContain('Triaje de Emergencia');
    expect(el.textContent).toContain('HSP-ADM-01');
  });

  it('debe calcular el SLA y mostrar cronómetro en fase RESOLUCION (B4)', () => {
    const sla = component.slaCalculado();
    expect(sla).toBeTruthy();
    expect(sla?.fase).toBe('RESOLUCION');
    expect(sla?.restanteMs).toBeGreaterThan(0);
  });

  it('debe iniciar atención técnica y actualizar la fase del cronómetro al recibir evento onIniciar (B4)', () => {
    component.onIniciar();
    fixture.detectChanges();

    expect(turnoApiMock.iniciarAtencion).toHaveBeenCalledWith(201);
    expect(component.mensajeExito()).toContain('Atención técnica iniciada');
  });

  it('debe abrir modal de resolución y completar el flujo resolver (B5)', () => {
    component.abrirDialogoResolver();
    fixture.detectChanges();

    expect(component.modalResolverAbierto()).toBe(true);

    component.confirmarResolucion({
      diagnostico: 'Servicio local de base de datos detenido por corte de energía.',
      accionRealizada: 'Se reinició el servicio GalenHosHostService y se comprobó conectividad con ping.',
      tipoSolucion: 'DEFINITIVA',
      articuloConocimientoId: 501,
    });
    fixture.detectChanges();

    expect(turnoApiMock.resolver).toHaveBeenCalledWith(201, expect.objectContaining({
      tipoSolucion: 'DEFINITIVA',
      articuloConocimientoId: 501,
    }));
    expect(component.modalResolverAbierto()).toBe(false);
    expect(component.mensajeExito()).toContain('Ticket resuelto exitosamente');
    expect(component.ticket()?.estado).toBe(EstadoTicket.RESUELTO);
  });

  it('debe abrir modal de escalamiento y completar el flujo escalar a Nivel 2 (B6)', () => {
    component.abrirDialogoEscalar();
    fixture.detectChanges();

    expect(component.modalEscalarAbierto()).toBe(true);

    component.confirmarEscalamiento({
      motivo: 'Falla física detectada en el enlace de switch de comunicaciones piso 2.',
    });
    fixture.detectChanges();

    expect(turnoApiMock.escalar).toHaveBeenCalledWith(201, {
      motivo: 'Falla física detectada en el enlace de switch de comunicaciones piso 2.',
    });
    expect(component.modalEscalarAbierto()).toBe(false);
    expect(component.mensajeExito()).toContain('Ticket derivado a Soporte de Nivel 2');
    expect(component.ticket()?.estado).toBe(EstadoTicket.ESCALADO);
    expect(component.ticket()?.nivelSoporte).toBe(NivelSoporte.N2);
  });

  it('debe mostrar pantalla de error empática si el ticket no existe (404)', () => {
    turnoApiMock.obtener.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))
    );

    component.cargarDetalle();
    fixture.detectChanges();

    expect(component.ticket()).toBeNull();
    expect(component.error()).toContain('El ticket solicitado no existe');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ficha-error')).toBeTruthy();
  });
});
