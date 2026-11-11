import { TestBed } from '@angular/core/testing';
import { TicketMapper } from './ticket.mapper';
import { LoggerService } from '../../nucleo/servicios/logger.service';
import { EstadoTicket } from './estado-ticket.enum';
import { EstadoSLA } from './estado-sla.enum';
import { PrioridadTicket } from './prioridad.enum';
import { NivelSoporte } from './nivel-soporte.enum';

describe('TicketMapper', () => {
  let mapper: TicketMapper;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mapper = TestBed.inject(TicketMapper);
    warnSpy = vi.spyOn(TestBed.inject(LoggerService), 'warn').mockImplementation(() => {});
  });

  describe('estado', () => {
    it('acepta los valores canónicos', () => {
      for (const estado of Object.values(EstadoTicket)) {
        expect(mapper.estado(estado)).toBe(estado);
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('mapea los alias heredados', () => {
      expect(mapper.estado('EN_ATENCION')).toBe(EstadoTicket.EN_PROCESO);
      expect(mapper.estado('ABIERTO')).toBe(EstadoTicket.NUEVO);
      expect(mapper.estado('EN_PROGRESO')).toBe(EstadoTicket.EN_PROCESO);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('usa NUEVO y registra advertencia ante un valor desconocido', () => {
      expect(mapper.estado('INVENTADO')).toBe(EstadoTicket.NUEVO);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('usa NUEVO ante null o undefined', () => {
      expect(mapper.estado(null)).toBe(EstadoTicket.NUEVO);
      expect(mapper.estado(undefined)).toBe(EstadoTicket.NUEVO);
    });
  });

  describe('prioridad', () => {
    it('acepta P1 a P4', () => {
      for (const p of Object.values(PrioridadTicket)) {
        expect(mapper.prioridad(p)).toBe(p);
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('mapea los alias heredados', () => {
      expect(mapper.prioridad('P1_CRITICA')).toBe(PrioridadTicket.P1);
      expect(mapper.prioridad('CRITICA')).toBe(PrioridadTicket.P1);
      expect(mapper.prioridad('P2_ALTA')).toBe(PrioridadTicket.P2);
      expect(mapper.prioridad('ALTA')).toBe(PrioridadTicket.P2);
      expect(mapper.prioridad('P3_MEDIA')).toBe(PrioridadTicket.P3);
      expect(mapper.prioridad('MEDIA')).toBe(PrioridadTicket.P3);
      expect(mapper.prioridad('P4_BAJA')).toBe(PrioridadTicket.P4);
      expect(mapper.prioridad('BAJA')).toBe(PrioridadTicket.P4);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('usa P4 y registra advertencia ante un valor desconocido', () => {
      expect(mapper.prioridad('P9')).toBe(PrioridadTicket.P4);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('estadoSla', () => {
    it('acepta los valores canónicos', () => {
      expect(mapper.estadoSla('A_TIEMPO')).toBe(EstadoSLA.A_TIEMPO);
      expect(mapper.estadoSla('ALERTA')).toBe(EstadoSLA.ALERTA);
      expect(mapper.estadoSla('INCUMPLIDO')).toBe(EstadoSLA.INCUMPLIDO);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('mapea los alias heredados', () => {
      expect(mapper.estadoSla('DENTRO_TIEMPO')).toBe(EstadoSLA.A_TIEMPO);
      expect(mapper.estadoSla('POR_VENCER')).toBe(EstadoSLA.ALERTA);
      expect(mapper.estadoSla('VENCIDO')).toBe(EstadoSLA.INCUMPLIDO);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('usa A_TIEMPO y registra advertencia ante un valor desconocido', () => {
      expect(mapper.estadoSla('NO_SE')).toBe(EstadoSLA.A_TIEMPO);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('nivelSoporte', () => {
    it('acepta N1 y N2', () => {
      expect(mapper.nivelSoporte('N1')).toBe(NivelSoporte.N1);
      expect(mapper.nivelSoporte('N2')).toBe(NivelSoporte.N2);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('usa N1 y registra advertencia ante un valor desconocido', () => {
      expect(mapper.nivelSoporte('N3')).toBe(NivelSoporte.N1);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('resumen', () => {
    it('mapea un resumen con alias y normaliza nulos', () => {
      const r = mapper.resumen({
        id: 7,
        codigo: 'INC-2026-00007',
        tipo: 'SOLICITUD',
        titulo: 'Sin red',
        prioridad: 'CRITICA',
        estado: 'EN_ATENCION',
        estadoSla: 'POR_VENCER',
        nivelSoporte: 'N2',
        area: { id: 1, nombre: 'Emergencia' },
        solicitante: { id: 5, nombre: 'Dra. Rosa Mendoza Quispe' },
        fechaCreacion: '2026-11-10T08:00:00-05:00',
      });
      expect(r.prioridad).toBe(PrioridadTicket.P1);
      expect(r.estado).toBe(EstadoTicket.EN_PROCESO);
      expect(r.estadoSla).toBe(EstadoSLA.ALERTA);
      expect(r.nivelSoporte).toBe(NivelSoporte.N2);
      expect(r.asignadoA).toBeNull();
      expect(r.fechaLimiteResolucion).toBeNull();
    });
  });

  describe('detalle', () => {
    it('mapea historial y escalamientos con alias', () => {
      const d = mapper.detalle({
        id: 1,
        codigo: 'INC-2026-00001',
        tipo: 'INCIDENTE',
        titulo: 'Falla',
        prioridad: 'P2',
        estado: 'ESCALADO',
        estadoSla: 'A_TIEMPO',
        nivelSoporte: 'N2',
        area: { id: 1, nombre: 'UCI' },
        solicitante: { id: 5, nombre: 'Rosa' },
        fechaCreacion: '2026-11-10T08:00:00-05:00',
        categoria: { id: 2, nombre: 'Red' },
        impacto: 'ALTO',
        urgencia: 'MEDIA',
        historial: [
          { fecha: '2026-11-10T08:00:00-05:00', usuario: 'Rosa', estadoAnterior: null, estadoNuevo: 'ABIERTO', comentario: 'Registro' },
          { fecha: '2026-11-10T09:00:00-05:00', usuario: 'Carlos', estadoAnterior: 'ABIERTO', estadoNuevo: 'EN_ATENCION' },
        ],
        escalamientos: [
          { fecha: '2026-11-10T10:00:00-05:00', nivelOrigen: 'N1', nivelDestino: 'N2', usuarioOrigen: 'Carlos', motivo: 'Requiere especialista' },
        ],
      });
      expect(d.historial[0].estadoAnterior).toBeNull();
      expect(d.historial[0].estadoNuevo).toBe(EstadoTicket.NUEVO);
      expect(d.historial[1].estadoAnterior).toBe(EstadoTicket.NUEVO);
      expect(d.historial[1].estadoNuevo).toBe(EstadoTicket.EN_PROCESO);
      expect(d.historial[1].comentario).toBe('');
      expect(d.escalamientos[0].nivelDestino).toBe(NivelSoporte.N2);
      expect(d.escalamientos[0].usuarioDestino).toBeNull();
      expect(d.soluciones).toEqual([]);
    });
  });

  describe('pagina', () => {
    it('mapea el contenido y aplica valores por defecto', () => {
      const p = mapper.pagina({ contenido: [{ id: 1 }] }, (i: any) => i.id);
      expect(p.contenido).toEqual([1]);
      expect(p.pagina).toBe(0);
      expect(p.tamano).toBe(10);
      expect(p.totalElementos).toBe(0);
      expect(p.totalPaginas).toBe(0);
    });
  });
});