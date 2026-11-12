import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraAccionesTicketComponent } from './barra-acciones-ticket.component';
import { TicketTurno } from '../../modelos/ticket-turno.model';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { NivelSoporte } from '../../../../compartido/modelos/nivel-soporte.enum';
import { EstadoSla } from '../../../../compartido/modelos/estado-sla.enum';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('BarraAccionesTicketComponent (B3)', () => {
  let component: BarraAccionesTicketComponent;
  let fixture: ComponentFixture<BarraAccionesTicketComponent>;

  function fabricarTicket(parcial: Partial<TicketTurno> = {}): TicketTurno {
    return {
      id: 1,
      codigo: 'INC-2026-00001',
      titulo: 'Incidencia de prueba',
      descripcion: 'Detalle',
      prioridad: Prioridad.P3_MEDIA,
      estado: EstadoTicket.NUEVO,
      nivelSoporte: NivelSoporte.N1,
      categoriaId: 1,
      categoriaNombre: 'Hardware',
      areaNombre: 'Admisión',
      solicitanteNombre: 'Enfermera',
      anexo: '100',
      equipo: null,
      asignadoA: null,
      esMio: false,
      reabierto: false,
      fechaCreacionIso: new Date().toISOString(),
      sla: {
        inicioIso: new Date().toISOString(),
        limiteRespuestaIso: new Date().toISOString(),
        limiteResolucionIso: new Date().toISOString(),
        respuestaRealIso: null,
        estadoServidor: EstadoSla.A_TIEMPO,
        desfaseServidorMs: 0,
        fase: 'RESPUESTA',
      },
      ...parcial,
    };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraAccionesTicketComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BarraAccionesTicketComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ticket', fabricarTicket());
    fixture.componentRef.setInput('rol', RolUsuario.PRACTICANTE);
    fixture.detectChanges();
  });

  it('debe mostrar el botón Tomar ticket para un ticket NUEVO P3 sin asignar', () => {
    const el = fixture.nativeElement as HTMLElement;
    const boton = el.querySelector('.btn-accion--primaria') as HTMLButtonElement;
    expect(boton).toBeTruthy();
    expect(boton.textContent).toContain('Tomar ticket');
  });

  it('debe emitir alTomar({ iniciarAtencion: false }) al hacer clic en Tomar ticket', () => {
    let eventoTomar: { iniciarAtencion: boolean } | null = null;
    component.alTomar.subscribe((ev) => {
      eventoTomar = ev;
    });

    const el = fixture.nativeElement as HTMLElement;
    const boton = el.querySelector('.btn-accion--primaria') as HTMLButtonElement;
    boton.click();

    expect(eventoTomar).toEqual({ iniciarAtencion: false });
  });

  it('debe mostrar Tomar y comenzar para un ticket NUEVO P1 sin asignar y emitir con iniciarAtencion: true', () => {
    fixture.componentRef.setInput('ticket', fabricarTicket({ prioridad: Prioridad.P1_CRITICA }));
    fixture.detectChanges();

    let eventoTomar: { iniciarAtencion: boolean } | null = null;
    component.alTomar.subscribe((ev) => {
      eventoTomar = ev;
    });

    const el = fixture.nativeElement as HTMLElement;
    const boton = el.querySelector('.btn-accion--primaria') as HTMLButtonElement;
    expect(boton.textContent).toContain('Tomar y comenzar');

    boton.click();
    expect(eventoTomar).toEqual({ iniciarAtencion: true });
  });

  it('debe mostrar Iniciar atención y Escalar a Nivel 2 para un ticket ASIGNADO propio', () => {
    fixture.componentRef.setInput(
      'ticket',
      fabricarTicket({
        estado: EstadoTicket.ASIGNADO,
        esMio: true,
        asignadoA: { id: 2, nombre: 'Yo' },
      })
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const botonPrimario = el.querySelector('.btn-accion--primaria') as HTMLButtonElement;
    const botonSecundario = el.querySelector('.btn-accion--secundaria') as HTMLButtonElement;

    expect(botonPrimario.textContent).toContain('Iniciar atención');
    expect(botonSecundario.textContent).toContain('Escalar a Nivel 2');

    let emitioIniciar = false;
    let emitioEscalar = false;
    component.alIniciar.subscribe(() => (emitioIniciar = true));
    component.alEscalar.subscribe(() => (emitioEscalar = true));

    botonPrimario.click();
    expect(emitioIniciar).toBe(true);

    botonSecundario.click();
    expect(emitioEscalar).toBe(true);
  });

  it('debe mostrar Resolver ticket y Escalar a Nivel 2 para un ticket EN_PROCESO propio', () => {
    fixture.componentRef.setInput(
      'ticket',
      fabricarTicket({
        estado: EstadoTicket.EN_PROCESO,
        esMio: true,
        asignadoA: { id: 2, nombre: 'Yo' },
      })
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const botonResolver = el.querySelector('.btn-accion--primaria') as HTMLButtonElement;
    expect(botonResolver.textContent).toContain('Resolver ticket');

    let emitioResolver = false;
    component.alResolver.subscribe(() => (emitioResolver = true));

    botonResolver.click();
    expect(emitioResolver).toBe(true);
  });

  it('debe mostrar solo lectura si el ticket está RESUELTO', () => {
    fixture.componentRef.setInput(
      'ticket',
      fabricarTicket({
        estado: EstadoTicket.RESUELTO,
        esMio: true,
      })
    );
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const botonPrimario = el.querySelector('.btn-accion--primaria');
    expect(botonPrimario).toBeNull();

    const insigniaLectura = el.querySelector('.insignia-estado-lectura');
    expect(insigniaLectura?.textContent).toContain('Ticket resuelto');
  });
});
