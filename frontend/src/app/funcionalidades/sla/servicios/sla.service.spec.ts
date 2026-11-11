import { TestBed } from '@angular/core/testing';
import { SlaService } from './sla.service';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';

describe('SlaService', () => {
  let service: SlaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlaService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializar con las 4 reglas pactadas (P1 a P4)', () => {
    const reglas = service.reglasSla();
    expect(reglas.length).toBe(4);
    expect(reglas.map(r => r.prioridad)).toEqual([
      PrioridadTicket.P1,
      PrioridadTicket.P2,
      PrioridadTicket.P3,
      PrioridadTicket.P4,
    ]);
  });

  it('debe evaluar los estados de SLA según los umbrales de la regla de negocio', () => {
    // Caso 1: A tiempo (tiempo restante > 20% del total)
    // 60 min total, quedan 30 min (50%) -> A_TIEMPO
    expect(service.evaluarEstadoSla(30, 60)).toBe(EstadoSla.A_TIEMPO);

    // Caso 2: Alerta (tiempo restante <= 20% del total)
    // 60 min total, quedan 12 min (20%) -> ALERTA
    expect(service.evaluarEstadoSla(12, 60)).toBe(EstadoSla.ALERTA);

    // 60 min total, quedan 5 min -> ALERTA
    expect(service.evaluarEstadoSla(5, 60)).toBe(EstadoSla.ALERTA);

    // Caso 3: Incumplido (tiempo restante <= 0)
    expect(service.evaluarEstadoSla(0, 60)).toBe(EstadoSla.INCUMPLIDO);
    expect(service.evaluarEstadoSla(-15, 60)).toBe(EstadoSla.INCUMPLIDO);
  });

  it('debe actualizar reglas y almacenarlas', () => {
    const reglasModificadas = service.reglasSla().map(r => 
      r.prioridad === PrioridadTicket.P1 ? { ...r, tiempoResolucionMin: 45 } : r
    );

    service.actualizarReglasSla(reglasModificadas);
    const p1Actualizado = service.reglasSla().find(r => r.prioridad === PrioridadTicket.P1);
    expect(p1Actualizado?.tiempoResolucionMin).toBe(45);
  });
});
