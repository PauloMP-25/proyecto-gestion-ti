import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RelojTicketActivoComponent } from './reloj-ticket-activo.component';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { signal } from '@angular/core';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';
import { PrioridadTicket } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';

describe('RelojTicketActivoComponent', () => {
  let component: RelojTicketActivoComponent;
  let fixture: ComponentFixture<RelojTicketActivoComponent>;
  let rolActualSignal = signal<RolUsuario | null>(RolUsuario.ADMINISTRADOR);

  const mockAuthService = {
    rolActual: rolActualSignal,
  };

  const ticketEjemplo: TicketResumen = {
    id: 't-1',
    codigo: 'INC-2026-0001',
    tipo: 'INCIDENTE',
    titulo: 'Fallo en sistema de radiología',
    estado: EstadoTicket.EN_PROCESO,
    prioridad: PrioridadTicket.P1,
    nivelActual: 'N1',
    areaClinica: 'Radiología',
    fechaCreacion: new Date().toISOString(),
    slaResolucion: {
      fechaInicio: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 45 * 60000).toISOString(),
      estado: 'DENTRO_DE_PLAZO' as any,
      porcentajeConsumido: 25,
      tiempoRestanteMinutos: 45,
    },
  };

  const ticketEjemplo2: TicketResumen = {
    ...ticketEjemplo,
    id: 't-2',
    codigo: 'INC-2026-0002',
    titulo: 'Impresora en UCI no responde',
    prioridad: PrioridadTicket.P2,
    areaClinica: 'UCI',
  };

  beforeEach(async () => {
    rolActualSignal.set(RolUsuario.ADMINISTRADOR);

    await TestBed.configureTestingModule({
      imports: [RelojTicketActivoComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelojTicketActivoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ticket', ticketEjemplo);
    fixture.componentRef.setInput('ticketsDisponibles', [ticketEjemplo, ticketEjemplo2]);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy?.();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe ocultar el botón Escalar a Nivel 2 cuando el usuario es ADMINISTRADOR', () => {
    expect(component.puedeEscalar()).toBe(false);
    const botonEscalar = fixture.nativeElement.querySelector('.btn-control--escalar');
    expect(botonEscalar).toBeNull();
  });

  it('debe mostrar el botón Escalar a Nivel 2 cuando el usuario es PRACTICANTE (Nivel 1)', () => {
    rolActualSignal.set(RolUsuario.PRACTICANTE);
    fixture.detectChanges();

    expect(component.puedeEscalar()).toBe(true);
    const botonEscalar = fixture.nativeElement.querySelector('.btn-control--escalar');
    expect(botonEscalar).not.toBeNull();
  });

  it('debe alternar el estado del selector desplegable al llamar a toggleSelector', () => {
    expect(component.selectorAbierto()).toBe(false);
    component.toggleSelector();
    expect(component.selectorAbierto()).toBe(true);
    component.toggleSelector();
    expect(component.selectorAbierto()).toBe(false);
  });

  it('debe emitir alSeleccionarOtroTicket y cerrar el menú al elegir un ticket del dropdown', () => {
    let ticketEmitido: TicketResumen | null = null;
    component.alSeleccionarOtroTicket.subscribe((t) => (ticketEmitido = t));

    component.toggleSelector();
    expect(component.selectorAbierto()).toBe(true);

    component.seleccionarTicketDropdown(ticketEjemplo2);
    expect(ticketEmitido).toEqual(ticketEjemplo2);
    expect(component.selectorAbierto()).toBe(false);
  });

  it('debe cerrar el selector al presionar la tecla Escape', () => {
    component.toggleSelector();
    expect(component.selectorAbierto()).toBe(true);

    component.onEscape();
    expect(component.selectorAbierto()).toBe(false);
  });
});
