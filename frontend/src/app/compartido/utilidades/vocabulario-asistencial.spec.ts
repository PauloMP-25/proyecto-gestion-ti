import { EstadoTicket } from '../modelos/estado-ticket.enum';
import { Rol } from '../../nucleo/modelos/rol.enum';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
  ETIQUETA_ETAPA,
  MENSAJE_ETAPA,
  etiquetaEstado,
  etiquetaUrgencia,
  nivelPrioridad,
  textoTiempoEstimado,
  MSG
} from './vocabulario-asistencial';

describe('VocabularioAsistencial', () => {
  describe('Patrones de términos prohibidos', () => {
    it('debe detectar ITIL en variaciones', () => {
      const regex = TERMINOS_PROHIBIDOS_GLOBAL[0];
      expect(regex.test('Gestión ITIL')).toBe(true);
      expect(regex.test('ITIL v4')).toBe(true);
      expect(regex.test('itil 4')).toBe(true);
      expect(regex.test('Sistema hospitalario')).toBe(false);
    });

    it('debe detectar términos técnicos prohibidos para el usuario final', () => {
      const prohibidos = TERMINOS_PROHIBIDOS_USUARIO_FINAL;
      const testear = (t: string) => prohibidos.some(r => r.test(t));

      expect(testear('Incumplimiento de SLA')).toBe(true);
      expect(testear('Activo de la CMDB')).toBe(true);
      expect(testear('Consultar KEDB')).toBe(true);
      expect(testear('Ticket vencido')).toBe(true);
      expect(testear('Ticket P1')).toBe(true);
      expect(testear('Ticket escalado')).toBe(true);
      expect(testear('Solicitud en atención')).toBe(false);
    });
  });

  describe('Constantes institucionales', () => {
    it('ETIQUETA_ETAPA no debe contener términos prohibidos para usuario final', () => {
      const valores = Object.values(ETIQUETA_ETAPA).join(' ');
      TERMINOS_PROHIBIDOS_USUARIO_FINAL.forEach(r => {
        expect(r.test(valores)).toBe(false);
      });
      TERMINOS_PROHIBIDOS_GLOBAL.forEach(r => {
        expect(r.test(valores)).toBe(false);
      });
    });

    it('MENSAJE_ETAPA no debe contener términos prohibidos para usuario final', () => {
      const valores = Object.values(MENSAJE_ETAPA).join(' ');
      TERMINOS_PROHIBIDOS_USUARIO_FINAL.forEach(r => {
        expect(r.test(valores)).toBe(false);
      });
    });

    it('MSG no debe contener términos prohibidos para usuario final', () => {
      const valores = Object.values(MSG).join(' ');
      TERMINOS_PROHIBIDOS_USUARIO_FINAL.forEach(r => {
        expect(r.test(valores)).toBe(false);
      });
    });
  });

  describe('etiquetaEstado', () => {
    it('debe devolver etiquetas asistenciales para USUARIO_FINAL', () => {
      expect(etiquetaEstado(EstadoTicket.NUEVO, Rol.USUARIO_FINAL)).toBe('Registrado');
      expect(etiquetaEstado(EstadoTicket.ASIGNADO, Rol.USUARIO_FINAL)).toBe('En atención');
      expect(etiquetaEstado(EstadoTicket.EN_PROCESO, Rol.USUARIO_FINAL)).toBe('En atención');
      expect(etiquetaEstado(EstadoTicket.ESCALADO, Rol.USUARIO_FINAL)).toBe('En atención');
      expect(etiquetaEstado(EstadoTicket.REABIERTO, Rol.USUARIO_FINAL)).toBe('En atención');
      expect(etiquetaEstado(EstadoTicket.RESUELTO, Rol.USUARIO_FINAL)).toBe('Resuelto');
      expect(etiquetaEstado(EstadoTicket.CERRADO, Rol.USUARIO_FINAL)).toBe('Cerrado');
    });

    it('debe devolver "Por tomar" para PRACTICANTE en estado NUEVO', () => {
      expect(etiquetaEstado(EstadoTicket.NUEVO, Rol.PRACTICANTE)).toBe('Por tomar');
    });

    it('debe devolver "Nuevo" para ADMINISTRADOR en estado NUEVO', () => {
      expect(etiquetaEstado(EstadoTicket.NUEVO, Rol.ADMINISTRADOR)).toBe('Nuevo');
    });

    it('debe devolver términos técnicos adecuados para personal de soporte', () => {
      expect(etiquetaEstado(EstadoTicket.ASIGNADO, Rol.PRACTICANTE)).toBe('Asignado');
      expect(etiquetaEstado(EstadoTicket.EN_PROCESO, Rol.PRACTICANTE)).toBe('En proceso');
      expect(etiquetaEstado(EstadoTicket.ESCALADO, Rol.PRACTICANTE)).toBe('Escalado');
      expect(etiquetaEstado(EstadoTicket.REABIERTO, Rol.PRACTICANTE)).toBe('Reabierto');
    });
  });

  describe('nivelPrioridad y etiquetaUrgencia', () => {
    it('debe mapear prioridades P1..P4 y literales al número 1..4', () => {
      expect(nivelPrioridad('P1')).toBe(1);
      expect(nivelPrioridad('CRITICA')).toBe(1);
      expect(nivelPrioridad('P2_ALTA')).toBe(2);
      expect(nivelPrioridad('MEDIA')).toBe(3);
      expect(nivelPrioridad('BAJA')).toBe(4);
    });

    it('debe lanzar error controlado si la prioridad es desconocida', () => {
      expect(() => nivelPrioridad('INEXISTENTE')).toThrowError(/Prioridad desconocida/);
    });

    it('debe mostrar etiquetas amigables sin prefijo P para USUARIO_FINAL', () => {
      expect(etiquetaUrgencia('P1', Rol.USUARIO_FINAL)).toBe('Atención inmediata');
      expect(etiquetaUrgencia('P2', Rol.USUARIO_FINAL)).toBe('Urgente');
      expect(etiquetaUrgencia('P3', Rol.USUARIO_FINAL)).toBe('Normal');
      expect(etiquetaUrgencia('P4', Rol.USUARIO_FINAL)).toBe('Programada');
    });

    it('debe incluir el código Px para técnicos y administradores', () => {
      expect(etiquetaUrgencia('P1', Rol.PRACTICANTE)).toBe('P1 · Atención inmediata');
      expect(etiquetaUrgencia('P2', Rol.ADMINISTRADOR)).toBe('P2 · Urgente');
    });
  });

  describe('textoTiempoEstimado', () => {
    it('debe retornar vacío si limiteIso es nulo', () => {
      expect(textoTiempoEstimado(null, Date.now())).toBe('');
    });

    it('debe retornar mensaje empático sin la palabra "vencido" si el tiempo ya pasó', () => {
      const ahora = Date.now();
      const pasado = new Date(ahora - 3600000).toISOString();
      const resultado = textoTiempoEstimado(pasado, ahora);
      expect(resultado).toBe('Estamos priorizando su caso.');
      expect(resultado.toLowerCase()).not.toContain('vencido');
    });

    it('debe formatear fecha u hora para fecha futura', () => {
      const ahora = new Date('2026-11-11T10:00:00-05:00').getTime();
      const futuroMismoDia = '2026-11-11T14:30:00-05:00';
      const texto = textoTiempoEstimado(futuroMismoDia, ahora);
      expect(texto).toContain('Tiempo estimado de solución:');
      expect(texto).toContain('14:30');
    });
  });
});
