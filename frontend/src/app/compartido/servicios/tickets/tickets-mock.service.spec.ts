import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TicketsMockService } from './tickets-mock.service';
import { EstadoTicket } from '../../modelos/estado-ticket.enum';
import { PrioridadTicket } from '../../modelos/prioridad.enum';
import { NivelSoporte } from '../../modelos/nivel-soporte.enum';
import { AuthService } from '../../../nucleo/auth/auth.service';

describe('TicketsMockService', () => {
  let service: TicketsMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TicketsMockService, provideRouter([])],
    });
    service = TestBed.inject(TicketsMockService);
  });

  it('crea un ticket recalculando la prioridad como lo hará el backend', async () => {
    const ticket = await firstValueFrom(service.crear({
      tipo: 'INCIDENTE',
      idCategoria: 1,
      impacto: 'ALTO',
      urgencia: 'ALTA',
      titulo: 'Sin red en triaje',
      descripcion: 'La estación no tiene conectividad desde las 8am.',
    }));
    expect(ticket.codigo).toMatch(/^INC-2026-\d{5}$/);
    expect(ticket.prioridad).toBe(PrioridadTicket.P1);
    expect(ticket.estado).toBe(EstadoTicket.NUEVO);
    expect(ticket.nivelSoporte).toBe(NivelSoporte.N1);
    expect(ticket.fechaLimiteResolucion).toBeTruthy();
    const usuario = TestBed.inject(AuthService).usuarioActual();
    expect(ticket.solicitante.nombre).toBe(usuario?.nombreCompleto);
  });

  it('lista con la forma de paginación del contrato', async () => {
    const pagina = await firstValueFrom(service.listar({}, { pagina: 0, tamano: 5 }));
    expect(pagina.contenido.length).toBe(5);
    expect(pagina.pagina).toBe(0);
    expect(pagina.tamano).toBe(5);
    expect(pagina.totalElementos).toBeGreaterThan(5);
    expect(pagina.totalPaginas).toBe(Math.ceil(pagina.totalElementos / 5));
  });

  it('filtra por estado, prioridad, área y texto', async () => {
    const nuevos = await firstValueFrom(service.listar({ estado: EstadoTicket.NUEVO }, { pagina: 0, tamano: 100 }));
    expect(nuevos.contenido.length).toBeGreaterThan(0);
    expect(nuevos.contenido.every(t => t.estado === EstadoTicket.NUEVO)).toBe(true);

    const p1 = await firstValueFrom(service.listar({ prioridad: PrioridadTicket.P1 }, { pagina: 0, tamano: 100 }));
    expect(p1.contenido.every(t => t.prioridad === PrioridadTicket.P1)).toBe(true);

    const area = await firstValueFrom(service.listar({ idArea: 1 }, { pagina: 0, tamano: 100 }));
    expect(area.contenido.every(t => t.area.id === 1)).toBe(true);

    const objetivo = nuevos.contenido[0];
    const porCodigo = await firstValueFrom(service.listar({ texto: objetivo.codigo }, { pagina: 0, tamano: 10 }));
    expect(porCodigo.contenido.some(t => t.id === objetivo.id)).toBe(true);
  });

  it('misTickets devuelve solo los tickets del usuario actual', async () => {
    const pagina = await firstValueFrom(service.misTickets({ pagina: 0, tamano: 100 }));
    const nombre = TestBed.inject(AuthService).usuarioActual()?.nombreCompleto;
    expect(pagina.contenido.length).toBeGreaterThan(0);
    expect(pagina.contenido.every(t => t.solicitante.nombre === nombre)).toBe(true);
  });

  it('recorre el ciclo de vida completo de un ticket', async () => {
    const nuevos = await firstValueFrom(service.listar({ estado: EstadoTicket.NUEVO }, { pagina: 0, tamano: 1 }));
    const id = nuevos.contenido[0].id;

    let ticket = await firstValueFrom(service.asignar(id, 8));
    expect(ticket.estado).toBe(EstadoTicket.ASIGNADO);
    expect(ticket.asignadoA?.id).toBe(8);

    ticket = await firstValueFrom(service.cambiarEstado(id, 'iniciar'));
    expect(ticket.estado).toBe(EstadoTicket.EN_PROCESO);
    expect(ticket.fechaRespuestaReal).toBeTruthy();

    ticket = await firstValueFrom(service.escalar(id, 'Requiere revisión del especialista de redes del hospital.'));
    expect(ticket.estado).toBe(EstadoTicket.ESCALADO);
    expect(ticket.nivelSoporte).toBe(NivelSoporte.N2);
    expect(ticket.escalamientos.length).toBeGreaterThan(0);

    ticket = await firstValueFrom(service.resolver(id, 'Se reconfiguró el switch de la zona y se verificó conectividad.'));
    expect(ticket.estado).toBe(EstadoTicket.RESUELTO);
    expect(ticket.soluciones.length).toBeGreaterThan(0);

    ticket = await firstValueFrom(service.cambiarEstado(id, 'reabrir', 'La falla persistió en la estación.'));
    expect(ticket.estado).toBe(EstadoTicket.REABIERTO);

    ticket = await firstValueFrom(service.tomar(id));
    expect(ticket.estado).toBe(EstadoTicket.ASIGNADO);

    ticket = await firstValueFrom(service.cambiarEstado(id, 'iniciar'));
    ticket = await firstValueFrom(service.resolver(id, 'Se reemplazó el cable de red dañado de la estación.'));
    ticket = await firstValueFrom(service.cambiarEstado(id, 'cerrar'));
    expect(ticket.estado).toBe(EstadoTicket.CERRADO);
    expect(ticket.fechaCierre).toBeTruthy();
    expect(ticket.historial.length).toBeGreaterThanOrEqual(7);
  });

  it('rechaza con 409 una transición inválida', async () => {
    const nuevos = await firstValueFrom(service.listar({ estado: EstadoTicket.NUEVO }, { pagina: 0, tamano: 1 }));
    const id = nuevos.contenido[0].id;
    await expect(firstValueFrom(service.cambiarEstado(id, 'cerrar'))).rejects.toMatchObject({ status: 409 });
    await expect(firstValueFrom(service.resolver(id, 'Solución aplicada sin iniciar la atención del ticket.'))).rejects.toMatchObject({ status: 409 });
  });

  it('rechaza con 404 un ticket inexistente', async () => {
    await expect(firstValueFrom(service.obtener(99999))).rejects.toMatchObject({ status: 404 });
  });
});