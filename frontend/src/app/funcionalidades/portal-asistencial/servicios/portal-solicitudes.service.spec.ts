import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { PortalSolicitudesMock } from './portal-solicitudes.mock';
import { mapearSolicitudResumen, mapearSolicitudDetalle, SolicitudDto } from '../modelos/dtos';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';

describe('PortalSolicitudesService & Mapeos (A1)', () => {
  let servicio: PortalSolicitudesMock;

  beforeEach(() => {
    servicio = new PortalSolicitudesMock();
    (servicio as any).latenciaMs = 0; // Desactivar latencia en pruebas
  });

  describe('PortalSolicitudesMock', () => {
    it('debe listar todas las solicitudes ordenadas con por confirmar primero', async () => {
      const pagina = await firstValueFrom(
        servicio.listar({ filtro: 'TODAS', pagina: 0, tamano: 10 })
      );

      expect(pagina.contenido.length).toBeGreaterThan(0);
      expect(pagina.totalElementos).toBe(4);
      // La primera debe ser la que requiere confirmacion
      expect(pagina.contenido[0].requiereConfirmacion).toBe(true);
      expect(pagina.contenido[0].etapa).toBe('RESUELTO');
    });

    it('debe filtrar solo solicitudes por confirmar', async () => {
      const pagina = await firstValueFrom(
        servicio.listar({ filtro: 'POR_CONFIRMAR', pagina: 0, tamano: 10 })
      );

      expect(pagina.contenido.length).toBe(1);
      expect(pagina.contenido[0].etapa).toBe('RESUELTO');
    });

    it('debe filtrar solicitudes en curso (registrado y en atencion)', async () => {
      const pagina = await firstValueFrom(
        servicio.listar({ filtro: 'EN_CURSO', pagina: 0, tamano: 10 })
      );

      expect(pagina.contenido.every((s) => s.etapa === 'REGISTRADO' || s.etapa === 'EN_ATENCION')).toBe(true);
    });

    it('debe filtrar solicitudes cerradas', async () => {
      const pagina = await firstValueFrom(
        servicio.listar({ filtro: 'CERRADAS', pagina: 0, tamano: 10 })
      );

      expect(pagina.contenido.every((s) => s.etapa === 'CERRADO')).toBe(true);
    });

    it('debe contar correctamente las solicitudes por confirmar', async () => {
      const conteo = await firstValueFrom(servicio.contarPorConfirmar());
      expect(conteo).toBe(1);
    });

    it('debe confirmar una solucion cambiando el estado a CERRADO', async () => {
      await firstValueFrom(servicio.confirmarSolucion(101));

      const detalle = await firstValueFrom(servicio.obtenerDetalle(101));
      expect(detalle.etapa).toBe('CERRADO');
      expect(detalle.requiereConfirmacion).toBe(false);
    });

    it('debe reabrir una solicitud marcandola como reabierta y en atencion', async () => {
      await firstValueFrom(
        servicio.reabrir(101, { motivo: 'La impresora sigue imprimiendo en blanco.' })
      );

      const detalle = await firstValueFrom(servicio.obtenerDetalle(101));
      expect(detalle.etapa).toBe('EN_ATENCION');
      expect(detalle.reabierta).toBe(true);
      expect(detalle.requiereConfirmacion).toBe(false);
    });

    it('debe registrar la calificacion del usuario asistencial', async () => {
      const cal = await firstValueFrom(
        servicio.calificar(101, { puntuacion: 5, comentario: 'Excelente y oportuna atención médica.' })
      );

      expect(cal.puntuacion).toBe(5);
      expect(cal.comentario).toBe('Excelente y oportuna atención médica.');

      const detalle = await firstValueFrom(servicio.obtenerDetalle(101));
      expect(detalle.calificada).toBe(true);
      expect(detalle.calificacion?.puntuacion).toBe(5);
    });
  });

  describe('Mapeo DTO -> Modelos de UI', () => {
    it('debe mapear correctamente DTO a SolicitudResumen', () => {
      const dto: SolicitudDto = {
        id: 50,
        codigo: 'INC-2026-00050',
        titulo: 'Falla de conexion',
        estado: EstadoTicket.EN_PROCESO,
        prioridad: Prioridad.P1_CRITICA,
        fechaCreacion: '2026-11-11T10:00:00Z',
        categoriaNombre: 'Redes',
        areaNombre: 'Emergencia',
      };

      const resumen = mapearSolicitudResumen(dto);

      expect(resumen.id).toBe(50);
      expect(resumen.codigo).toBe('INC-2026-00050');
      expect(resumen.etapa).toBe('EN_ATENCION');
      expect(resumen.urgencia).toBe(Prioridad.P1_CRITICA);
      expect(resumen.requiereConfirmacion).toBe(false);
    });

    it('debe activar requiereConfirmacion solo si la etapa proyectada es RESUELTO', () => {
      const dtoResuelto: SolicitudDto = {
        id: 51,
        codigo: 'INC-2026-00051',
        titulo: 'Monitor apagado',
        estado: EstadoTicket.RESUELTO,
        prioridad: Prioridad.P3_MEDIA,
        fechaCreacion: '2026-11-11T10:00:00Z',
      };

      const resumen = mapearSolicitudResumen(dtoResuelto);
      expect(resumen.etapa).toBe('RESUELTO');
      expect(resumen.requiereConfirmacion).toBe(true);
    });
  });
});
