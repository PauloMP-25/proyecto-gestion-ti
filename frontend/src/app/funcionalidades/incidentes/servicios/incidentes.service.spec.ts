import { TestBed } from '@angular/core/testing';

import { IncidentesService } from './incidentes.service';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';

describe('IncidentesService', () => {
  let service: IncidentesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncidentesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('abre por defecto en el filtro P1 y solo muestra incidentes P1', () => {
    expect(service.filtroChip()).toBe('p1');
    const lista = service.ticketsFiltrados();
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((t) => t.prioridad === PrioridadTicket.P1)).toBe(true);
  });

  it('la cola activa excluye solicitudes y tickets resueltos o cerrados', () => {
    const cola = service.colaActiva();
    expect(cola.every((t) => t.tipo === 'INCIDENTE')).toBe(true);
    expect(
      cola.every((t) => t.estado !== EstadoTicket.RESUELTO && t.estado !== EstadoTicket.CERRADO),
    ).toBe(true);
  });

  it('"todos" muestra toda la cola activa y su conteo coincide', () => {
    service.filtroChip.set('todos');
    expect(service.ticketsFiltrados().length).toBe(service.colaActiva().length);
    expect(service.conteos().todos).toBe(service.colaActiva().length);
  });

  it('"escalados" solo devuelve tickets de nivel N2', () => {
    service.filtroChip.set('escalados');
    const lista = service.ticketsFiltrados();
    expect(lista.length).toBe(service.conteos().escalados);
    expect(lista.every((t) => t.nivelActual === 'N2')).toBe(true);
  });

  it('"sla_riesgo" incluye los tickets con SLA vencido', () => {
    service.filtroChip.set('sla_riesgo');
    const codigos = service.ticketsFiltrados().map((t) => t.codigo);
    expect(codigos).toContain('TK-1060');
  });

  it('ordena por prioridad y luego por vencimiento de SLA más cercano', () => {
    service.filtroChip.set('todos');
    const lista = service.ticketsFiltrados();
    for (let i = 1; i < lista.length; i++) {
      const a = lista[i - 1];
      const b = lista[i];
      if (a.prioridad === b.prioridad) {
        expect(new Date(a.slaResolucion.fechaVencimiento).getTime()).toBeLessThanOrEqual(
          new Date(b.slaResolucion.fechaVencimiento).getTime(),
        );
      } else {
        expect(a.prioridad < b.prioridad).toBe(true);
      }
    }
  });

  it('busca por código, asunto o dirección IP', () => {
    service.filtroChip.set('todos');

    service.filtroTexto.set('tk-1082');
    expect(service.ticketsFiltrados().map((t) => t.codigo)).toEqual(['TK-1082']);

    service.filtroTexto.set('192.168.12.1');
    expect(service.ticketsFiltrados().map((t) => t.codigo)).toContain('TK-1082');

    service.filtroTexto.set('no-existe-xyz');
    expect(service.ticketsFiltrados()).toEqual([]);
  });
});