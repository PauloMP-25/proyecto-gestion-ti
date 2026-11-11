import { EstadoSla } from '../modelos/estado-sla.enum';
import { EstadoTicket } from '../modelos/estado-ticket.enum';
import { SlaTicketVista } from '../modelos/sla-vista.model';
import {
  calcularSla,
  calcularDesfase,
  formatearRestante,
  faseDesdeEstado,
  UMBRAL_ALERTA
} from './calculo-sla';

describe('CalculoSla', () => {
  const MIN = 60_000;

  describe('faseDesdeEstado', () => {
    it('debe ser RESPUESTA para tickets nuevos o asignados sin respuesta', () => {
      expect(faseDesdeEstado(EstadoTicket.NUEVO, null)).toBe('RESPUESTA');
      expect(faseDesdeEstado(EstadoTicket.ASIGNADO, null)).toBe('RESPUESTA');
      expect(faseDesdeEstado(EstadoTicket.REABIERTO, null)).toBe('RESPUESTA');
    });

    it('debe ser RESOLUCION si está EN_PROCESO o ya cuenta con primera respuesta', () => {
      expect(faseDesdeEstado(EstadoTicket.EN_PROCESO, null)).toBe('RESOLUCION');
      expect(faseDesdeEstado(EstadoTicket.ASIGNADO, '2026-11-11T10:00:00Z')).toBe('RESOLUCION');
      expect(faseDesdeEstado(EstadoTicket.REABIERTO, '2026-11-11T10:00:00Z')).toBe('RESOLUCION');
    });

    it('debe ser COMPLETADO para tickets resueltos, cerrados o escalados', () => {
      expect(faseDesdeEstado(EstadoTicket.ESCALADO)).toBe('COMPLETADO');
      expect(faseDesdeEstado(EstadoTicket.RESUELTO)).toBe('COMPLETADO');
      expect(faseDesdeEstado(EstadoTicket.CERRADO)).toBe('COMPLETADO');
    });
  });

  describe('formatearRestante', () => {
    it('formatea +135 min como "2 h 15 min"', () => {
      expect(formatearRestante(135 * MIN)).toBe('2 h 15 min');
    });

    it('formatea +45 min como "45 min"', () => {
      expect(formatearRestante(45 * MIN)).toBe('45 min');
    });

    it('formatea +10 min exactos como "10 min"', () => {
      expect(formatearRestante(10 * MIN)).toBe('10 min');
    });

    it('formatea +9 min 59 s como "09:59"', () => {
      const ms = 9 * MIN + 59 * 1000;
      expect(formatearRestante(ms)).toBe('09:59');
    });

    it('formatea +59 s como "00:59"', () => {
      expect(formatearRestante(59 * 1000)).toBe('00:59');
    });

    it('formatea 0 como "Vencido hace menos de 1 min"', () => {
      expect(formatearRestante(0)).toBe('Vencido hace menos de 1 min');
    });

    it('formatea -15 min como "Vencido hace 15 min"', () => {
      expect(formatearRestante(-15 * MIN)).toBe('Vencido hace 15 min');
    });

    it('formatea -125 min como "Vencido hace 2 h 5 min"', () => {
      expect(formatearRestante(-125 * MIN)).toBe('Vencido hace 2 h 5 min');
    });
  });

  describe('calcularSla (Tabla de verificación y semáforo)', () => {
    const ahoraBase = new Date('2026-11-11T10:00:00Z').getTime();
    const duracionTotal = 100 * MIN; // 100 minutos total
    const inicioIso = new Date(ahoraBase).toISOString();
    const limiteIso = new Date(ahoraBase + duracionTotal).toISOString();

    const crearVista = (desfaseMs = 0): SlaTicketVista => ({
      fase: 'RESPUESTA',
      inicioIso,
      limiteRespuestaIso: limiteIso,
      limiteResolucionIso: limiteIso,
      respuestaRealIso: null,
      estadoServidor: EstadoSla.A_TIEMPO,
      desfaseServidorMs: desfaseMs,
    });

    it('retorna texto vacío y A_TIEMPO cuando la fase es COMPLETADO', () => {
      const vista: SlaTicketVista = {
        ...crearVista(),
        fase: 'COMPLETADO'
      };
      const res = calcularSla(vista, ahoraBase);
      expect(res.fase).toBe('COMPLETADO');
      expect(res.texto).toBe('');
      expect(res.estado).toBe(EstadoSla.A_TIEMPO);
    });

    it('determina A_TIEMPO cuando el restante supera el umbral del 20%', () => {
      // Quedan 45 minutos de 100 (45% restante > 20%)
      const ahoraCliente = ahoraBase + 55 * MIN;
      const res = calcularSla(crearVista(), ahoraCliente);
      expect(res.estado).toBe(EstadoSla.A_TIEMPO);
      expect(res.texto).toBe('45 min');
      expect(res.porcentajeRestante).toBeCloseTo(0.45, 2);
    });

    it('determina ALERTA cuando queda exactamente el 20% del tiempo', () => {
      // Quedan 20 minutos de 100 (20%)
      const ahoraCliente = ahoraBase + 80 * MIN;
      const res = calcularSla(crearVista(), ahoraCliente);
      expect(res.estado).toBe(EstadoSla.ALERTA);
      expect(res.texto).toBe('20 min');
      expect(res.porcentajeRestante).toBeCloseTo(UMBRAL_ALERTA, 2);
    });

    it('determina ALERTA con formato mm:ss en los últimos 10 minutos', () => {
      // Quedan 9 min 59 s de 100
      const ahoraCliente = ahoraBase + (90 * MIN) + (1 * 1000);
      const res = calcularSla(crearVista(), ahoraCliente);
      expect(res.estado).toBe(EstadoSla.ALERTA);
      expect(res.texto).toBe('09:59');
    });

    it('determina INCUMPLIDO cuando el tiempo expira (restante <= 0)', () => {
      // Vencido por 15 minutos
      const ahoraCliente = ahoraBase + 115 * MIN;
      const res = calcularSla(crearVista(), ahoraCliente);
      expect(res.estado).toBe(EstadoSla.INCUMPLIDO);
      expect(res.texto).toBe('Vencido hace 15 min');
      expect(res.porcentajeRestante).toBe(0);
    });

    it('compensa correctamente el desfase del reloj del servidor', () => {
      // Si el reloj del cliente tiene 5 minutos de atraso (-5 min desfase servidor)
      const desfase = 5 * MIN;
      const ahoraCliente = ahoraBase + 95 * MIN; // Sin desfase quedaría 5 min
      const res = calcularSla(crearVista(desfase), ahoraCliente);
      // Con desfase: 95 + 5 = 100 min consumidos -> restante 0 ms -> INCUMPLIDO
      expect(res.estado).toBe(EstadoSla.INCUMPLIDO);
    });
  });

  describe('calcularDesfase', () => {
    it('calcula la diferencia positiva si el servidor va adelantado', () => {
      const servidorIso = '2026-11-11T10:05:00Z';
      const clienteMs = new Date('2026-11-11T10:00:00Z').getTime();
      expect(calcularDesfase(servidorIso, clienteMs)).toBe(5 * MIN);
    });
  });
});
