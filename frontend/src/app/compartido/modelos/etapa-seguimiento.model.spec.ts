import { EstadoTicket } from './estado-ticket.enum';
import { etapaDesdeEstado, ETAPAS_SEGUIMIENTO } from './etapa-seguimiento.model';

describe('EtapaSeguimientoModel', () => {
  it('debe tener definidas las 4 etapas asistenciales obligatorias', () => {
    expect(ETAPAS_SEGUIMIENTO).toEqual(['REGISTRADO', 'EN_ATENCION', 'RESUELTO', 'CERRADO']);
  });

  it('debe mapear NUEVO a REGISTRADO', () => {
    expect(etapaDesdeEstado(EstadoTicket.NUEVO)).toBe('REGISTRADO');
  });

  it('debe mapear estados de atención técnica a EN_ATENCION', () => {
    expect(etapaDesdeEstado(EstadoTicket.ASIGNADO)).toBe('EN_ATENCION');
    expect(etapaDesdeEstado(EstadoTicket.EN_PROCESO)).toBe('EN_ATENCION');
    expect(etapaDesdeEstado(EstadoTicket.ESCALADO)).toBe('EN_ATENCION');
    expect(etapaDesdeEstado(EstadoTicket.REABIERTO)).toBe('EN_ATENCION');
  });

  it('debe mapear RESUELTO a RESUELTO', () => {
    expect(etapaDesdeEstado(EstadoTicket.RESUELTO)).toBe('RESUELTO');
  });

  it('debe mapear CERRADO a CERRADO', () => {
    expect(etapaDesdeEstado(EstadoTicket.CERRADO)).toBe('CERRADO');
  });

  it('debe cubrir exhaustivamente todos los valores del enum EstadoTicket', () => {
    const todosLosEstados = Object.values(EstadoTicket);
    todosLosEstados.forEach(estado => {
      const etapa = etapaDesdeEstado(estado);
      expect(ETAPAS_SEGUIMIENTO).toContain(etapa);
    });
  });
});
