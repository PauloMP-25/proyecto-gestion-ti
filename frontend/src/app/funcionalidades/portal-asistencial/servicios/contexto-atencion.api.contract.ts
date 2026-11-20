import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { ContextoAtencionApi } from './contexto-atencion.api';
import { ReportarProblemaSolicitud } from '../modelos/contexto-atencion.model';
import { TipoTicket, Impacto, Urgencia } from '../../../compartido/modelos/impacto-urgencia.enum';

export function contratoContextoAtencionApi(obtenerInstancia: () => ContextoAtencionApi): void {
  describe('Contrato unificado ContextoAtencionApi', () => {
    let api: ContextoAtencionApi;

    beforeEach(() => {
      api = obtenerInstancia();
    });

    it('debe obtener la resolución del contexto asistencial del usuario', async () => {
      const ctx = await firstValueFrom(api.obtenerContexto());
      expect(ctx).toBeDefined();
      expect(ctx.ipOrigen).toBeTruthy();
      expect(['DETECTADO', 'IP_SIN_EQUIPO', 'IP_NO_REGISTRADA']).toContain(ctx.estadoDeteccion);
      expect(Array.isArray(ctx.impresorasArea)).toBe(true);
    });

    it('debe reportar un problema para la computadora actual', async () => {
      const solicitud: ReportarProblemaSolicitud = {
        tipo: 'INCIDENTE',
        asunto: 'Error en pantalla de triaje',
        descripcion: 'La aplicación de admisión se cierra inesperadamente al emitir ticket.',
        impacto: 'ALTO',
        urgencia: 'ALTA',
        objetivo: 'EQUIPO_ACTUAL',
        idImpresora: null,
        idAreaManual: null,
      };

      const ticket = await firstValueFrom(api.reportarProblema(solicitud));
      expect(ticket).toBeDefined();
      expect(ticket.id).toBeGreaterThan(0);
      expect(ticket.codigo).toBeTruthy();
      expect(ticket.titulo).toBe(solicitud.asunto);
      expect(ticket.descripcion).toBe(solicitud.descripcion);
    });

    it('debe reportar un problema para una impresora del área', async () => {
      const ctx = await firstValueFrom(api.obtenerContexto());
      const idImp = ctx.impresorasArea[0]?.id ?? 11;

      const solicitud: ReportarProblemaSolicitud = {
        tipo: 'INCIDENTE',
        asunto: 'Atasco constante de papel continuo',
        descripcion: 'La impresora de tickets tiene el rodillo trabado y no jala las hojas.',
        impacto: 'MEDIO',
        urgencia: 'MEDIA',
        objetivo: 'IMPRESORA_AREA',
        idImpresora: idImp,
        idAreaManual: null,
      };

      const ticket = await firstValueFrom(api.reportarProblema(solicitud));
      expect(ticket).toBeDefined();
      expect(ticket.id).toBeGreaterThan(0);
      expect(ticket.titulo).toBe(solicitud.asunto);
    });

    it('debe reportar un problema con objetivo OTRO (general o sin equipo asociado)', async () => {
      const solicitud: ReportarProblemaSolicitud = {
        tipo: 'SOLICITUD',
        asunto: 'Habilitación de acceso al módulo de estadísticas',
        descripcion: 'Se solicita permiso de lectura para el personal de turno de Admisión.',
        impacto: 'BAJO',
        urgencia: 'BAJA',
        objetivo: 'OTRO',
        idImpresora: null,
        idAreaManual: 1,
      };

      const ticket = await firstValueFrom(api.reportarProblema(solicitud));
      expect(ticket).toBeDefined();
      expect(ticket.id).toBeGreaterThan(0);
      expect(ticket.equipo).toBeNull();
    });
  });
}
