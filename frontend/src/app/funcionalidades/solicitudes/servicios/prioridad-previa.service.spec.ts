import { TestBed } from '@angular/core/testing';
import { PrioridadPreviaService } from './prioridad-previa.service';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { Impacto, Urgencia } from '../../../compartido/modelos/impacto-urgencia.enum';

describe('PrioridadPreviaService', () => {
  let service: PrioridadPreviaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrioridadPreviaService);
  });

  const combinaciones: [Impacto, Urgencia, PrioridadTicket][] = [
    ['ALTO', 'ALTA', PrioridadTicket.P1],
    ['ALTO', 'MEDIA', PrioridadTicket.P1],
    ['ALTO', 'BAJA', PrioridadTicket.P2],
    ['MEDIO', 'ALTA', PrioridadTicket.P1],
    ['MEDIO', 'MEDIA', PrioridadTicket.P2],
    ['MEDIO', 'BAJA', PrioridadTicket.P3],
    ['BAJO', 'ALTA', PrioridadTicket.P2],
    ['BAJO', 'MEDIA', PrioridadTicket.P3],
    ['BAJO', 'BAJA', PrioridadTicket.P4],
  ];

  it.each(combinaciones)('impacto %s + urgencia %s => %s', (impacto, urgencia, esperado) => {
    expect(service.calcular(impacto, urgencia).prioridad).toBe(esperado);
  });

  it('asigna los tiempos de respuesta y resolución por prioridad', () => {
    const p1 = service.calcular('ALTO', 'ALTA');
    expect(p1.respuestaMin).toBe(15);
    expect(p1.resolucionMin).toBe(120);

    const p2 = service.calcular('ALTO', 'BAJA');
    expect(p2.respuestaMin).toBe(30);
    expect(p2.resolucionMin).toBe(240);

    const p3 = service.calcular('MEDIO', 'BAJA');
    expect(p3.respuestaMin).toBe(120);
    expect(p3.resolucionMin).toBe(480);

    const p4 = service.calcular('BAJO', 'BAJA');
    expect(p4.respuestaMin).toBe(240);
    expect(p4.resolucionMin).toBe(1440);
  });

  it('formatea los tiempos en minutos u horas según corresponda', () => {
    const p1 = service.calcular('ALTO', 'ALTA');
    expect(p1.textoRespuesta).toBe('15 min');
    expect(p1.textoResolucion).toBe('2 h');

    const p4 = service.calcular('BAJO', 'BAJA');
    expect(p4.textoRespuesta).toBe('4 h');
    expect(p4.textoResolucion).toBe('24 h');
  });
});