import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Pagina } from '../../../compartido/modelos/pagina.model';
import { Prioridad } from '../../../compartido/modelos/prioridad.enum';
import { PortalSolicitudesApi } from './portal-solicitudes.api';
import {
  SolicitudResumen,
  SolicitudDetalle,
  ConsultaSolicitudes,
  CalificarPayload,
  CalificacionAtencion,
  ReabrirPayload,
} from '../modelos/solicitud.model';

@Injectable()
export class PortalSolicitudesMock extends PortalSolicitudesApi {
  private latenciaMs = 250;

  private solicitudes: SolicitudDetalle[] = [
    {
      id: 101,
      codigo: 'INC-2026-00231',
      titulo: 'Impresora de recetas no imprime tickets de atención',
      categoriaNombre: 'Hardware / Periféricos',
      areaNombre: 'Triaje de Emergencia',
      etapa: 'RESUELTO',
      urgencia: Prioridad.P2_ALTA,
      fechaCreacionIso: new Date(Date.now() - 3600000 * 2).toISOString(),
      fechaUltimaNovedadIso: new Date(Date.now() - 1800000).toISOString(),
      requiereConfirmacion: true,
      calificada: false,
      descripcion: 'La impresora térmica EPSON TM-T20 de triaje dejó de imprimir los tickets de los pacientes tras un corte breve de energía.',
      tecnicoVisible: 'Carlos Huamán (Soporte N1)',
      tiempoEstimadoSolucionIso: new Date(Date.now() + 3600000 * 2).toISOString(),
      reabierta: false,
      equipo: {
        id: 12,
        hostname: 'HSP-TRJ-IMP01',
        ip: '10.20.30.45',
        areaId: 1,
        area: 'Triaje de Emergencia',
        tipo: 'IMPRESORA' as any,
      },
      hitos: [
        {
          id: 1,
          etapa: 'REGISTRADO',
          mensaje: 'Solicitud registrada por Dra. Rosa Mendoza.',
          fechaIso: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          id: 2,
          etapa: 'EN_ATENCION',
          mensaje: 'Técnico Carlos Huamán inició la revisión en triaje.',
          fechaIso: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        },
        {
          id: 3,
          etapa: 'RESUELTO',
          mensaje: 'Se retiró papel atascado y se configuró puerto USB. Por favor confirme si la impresión funciona correctamente.',
          fechaIso: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      calificacion: null,
    },
    {
      id: 102,
      codigo: 'INC-2026-00235',
      titulo: 'Error al abrir módulo de Triaje en GalenHos',
      categoriaNombre: 'Software Asistencial / GalenHos',
      areaNombre: 'Triaje de Emergencia',
      etapa: 'EN_ATENCION',
      urgencia: Prioridad.P1_CRITICA,
      fechaCreacionIso: new Date(Date.now() - 1800000).toISOString(),
      fechaUltimaNovedadIso: new Date(Date.now() - 600000).toISOString(),
      requiereConfirmacion: false,
      calificada: false,
      descripcion: 'Muestra mensaje "Conexión rechazada por el servidor de base de datos" al intentar registrar signos vitales.',
      tecnicoVisible: 'Ing. Roberto Ramos',
      tiempoEstimadoSolucionIso: new Date(Date.now() + 1800000).toISOString(),
      reabierta: false,
      equipo: {
        id: 15,
        hostname: 'HSP-TRJ-PC02',
        ip: '10.20.30.46',
        areaId: 1,
        area: 'Triaje de Emergencia',
        tipo: 'COMPUTADORA' as any,
      },
      hitos: [
        {
          id: 1,
          etapa: 'REGISTRADO',
          mensaje: 'Solicitud registrada con prioridad inmediata.',
          fechaIso: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 2,
          etapa: 'EN_ATENCION',
          mensaje: 'Especialista TI verificando servicios de base de datos GalenHos.',
          fechaIso: new Date(Date.now() - 600000).toISOString(),
        },
      ],
      calificacion: null,
    },
    {
      id: 103,
      codigo: 'INC-2026-00210',
      titulo: 'Lector biométrico de huella no reconoce al personal de turno',
      categoriaNombre: 'Hardware / Biometría',
      areaNombre: 'Triaje de Emergencia',
      etapa: 'REGISTRADO',
      urgencia: Prioridad.P3_MEDIA,
      fechaCreacionIso: new Date(Date.now() - 3600000 * 5).toISOString(),
      fechaUltimaNovedadIso: new Date(Date.now() - 3600000 * 5).toISOString(),
      requiereConfirmacion: false,
      calificada: false,
      descripcion: 'El lector óptico de huella parpadea en rojo y no valida la entrada de los médicos de turno.',
      tecnicoVisible: null,
      tiempoEstimadoSolucionIso: new Date(Date.now() + 3600000 * 6).toISOString(),
      reabierta: false,
      equipo: null,
      hitos: [
        {
          id: 1,
          etapa: 'REGISTRADO',
          mensaje: 'Solicitud registrada en la Mesa de Ayuda.',
          fechaIso: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
      ],
      calificacion: null,
    },
    {
      id: 104,
      codigo: 'INC-2026-00180',
      titulo: 'Restablecimiento de contraseña de acceso a historias clínicas',
      categoriaNombre: 'Cuentas y Accesos',
      areaNombre: 'Triaje de Emergencia',
      etapa: 'CERRADO',
      urgencia: Prioridad.P4_BAJA,
      fechaCreacionIso: new Date(Date.now() - 86400000 * 2).toISOString(),
      fechaUltimaNovedadIso: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      requiereConfirmacion: false,
      calificada: true,
      descripcion: 'Se solicitó desbloqueo de usuario de GalenHos por intento fallido.',
      tecnicoVisible: 'Carlos Huamán (Soporte N1)',
      tiempoEstimadoSolucionIso: null,
      reabierta: false,
      equipo: null,
      hitos: [
        {
          id: 1,
          etapa: 'REGISTRADO',
          mensaje: 'Solicitud de acceso enviada.',
          fechaIso: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 2,
          etapa: 'EN_ATENCION',
          mensaje: 'Contraseña temporal generada.',
          fechaIso: new Date(Date.now() - 86400000 * 1.8).toISOString(),
        },
        {
          id: 3,
          etapa: 'RESUELTO',
          mensaje: 'Usuario desbloqueado.',
          fechaIso: new Date(Date.now() - 86400000 * 1.6).toISOString(),
        },
        {
          id: 4,
          etapa: 'CERRADO',
          mensaje: 'Confirmado por la usuaria.',
          fechaIso: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        },
      ],
      calificacion: {
        puntuacion: 5,
        comentario: 'Atención muy rápida y amable.',
        fechaIso: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      },
    },
  ];

  listar(c: ConsultaSolicitudes): Observable<Pagina<SolicitudResumen>> {
    let filtradas = [...this.solicitudes];

    // Filtros por pestaña
    if (c.filtro === 'POR_CONFIRMAR') {
      filtradas = filtradas.filter((s) => s.etapa === 'RESUELTO');
    } else if (c.filtro === 'EN_CURSO') {
      filtradas = filtradas.filter((s) => s.etapa === 'REGISTRADO' || s.etapa === 'EN_ATENCION');
    } else if (c.filtro === 'CERRADAS') {
      filtradas = filtradas.filter((s) => s.etapa === 'CERRADO');
    }

    // Filtro por texto
    if (c.texto && c.texto.trim()) {
      const q = c.texto.toLowerCase().trim();
      filtradas = filtradas.filter(
        (s) =>
          s.codigo.toLowerCase().includes(q) ||
          s.titulo.toLowerCase().includes(q) ||
          s.categoriaNombre.toLowerCase().includes(q)
      );
    }

    // Ordenar: "Por confirmar" primero, luego novedad más reciente
    filtradas.sort((a, b) => {
      if (a.requiereConfirmacion && !b.requiereConfirmacion) return -1;
      if (!a.requiereConfirmacion && b.requiereConfirmacion) return 1;
      return new Date(b.fechaUltimaNovedadIso).getTime() - new Date(a.fechaUltimaNovedadIso).getTime();
    });

    const tamano = c.tamano || 10;
    const totalElementos = filtradas.length;
    const totalPaginas = Math.ceil(totalElementos / tamano) || 1;
    const inicio = (c.pagina || 0) * tamano;
    const fin = inicio + tamano;
    const contenido: SolicitudResumen[] = filtradas.slice(inicio, fin).map((s) => ({
      id: s.id,
      codigo: s.codigo,
      titulo: s.titulo,
      categoriaNombre: s.categoriaNombre,
      areaNombre: s.areaNombre,
      etapa: s.etapa,
      urgencia: s.urgencia,
      fechaCreacionIso: s.fechaCreacionIso,
      fechaUltimaNovedadIso: s.fechaUltimaNovedadIso,
      requiereConfirmacion: s.requiereConfirmacion,
      calificada: s.calificada,
    }));

    return of({
      contenido,
      pagina: c.pagina,
      tamano,
      totalElementos,
      totalPaginas,
    }).pipe(delay(this.latenciaMs));
  }

  obtenerDetalle(id: number): Observable<SolicitudDetalle> {
    const encontrada = this.solicitudes.find((s) => s.id === id);
    if (!encontrada) {
      return throwError(() => new Error('Solicitud no encontrada'));
    }
    return of({ ...encontrada }).pipe(delay(this.latenciaMs));
  }

  contarPorConfirmar(): Observable<number> {
    const total = this.solicitudes.filter((s) => s.etapa === 'RESUELTO').length;
    return of(total).pipe(delay(this.latenciaMs));
  }

  confirmarSolucion(id: number): Observable<void> {
    const index = this.solicitudes.findIndex((s) => s.id === id);
    if (index >= 0) {
      const s = this.solicitudes[index];
      this.solicitudes[index] = {
        ...s,
        etapa: 'CERRADO',
        requiereConfirmacion: false,
        fechaUltimaNovedadIso: new Date().toISOString(),
        hitos: [
          ...s.hitos,
          {
            id: s.hitos.length + 1,
            etapa: 'CERRADO',
            mensaje: 'El usuario confirmó la solución del problema.',
            fechaIso: new Date().toISOString(),
          },
        ],
      };
    }
    return of(void 0).pipe(delay(this.latenciaMs));
  }

  reabrir(id: number, p: ReabrirPayload): Observable<void> {
    const index = this.solicitudes.findIndex((s) => s.id === id);
    if (index >= 0) {
      const s = this.solicitudes[index];
      this.solicitudes[index] = {
        ...s,
        etapa: 'EN_ATENCION',
        reabierta: true,
        requiereConfirmacion: false,
        fechaUltimaNovedadIso: new Date().toISOString(),
        hitos: [
          ...s.hitos,
          {
            id: s.hitos.length + 1,
            etapa: 'EN_ATENCION',
            mensaje: `Solicitud reabierta por el usuario: ${p.motivo}`,
            fechaIso: new Date().toISOString(),
          },
        ],
      };
    }
    return of(void 0).pipe(delay(this.latenciaMs));
  }

  calificar(id: number, p: CalificarPayload): Observable<CalificacionAtencion> {
    const cal: CalificacionAtencion = {
      puntuacion: p.puntuacion,
      comentario: p.comentario ?? null,
      fechaIso: new Date().toISOString(),
    };

    const index = this.solicitudes.findIndex((s) => s.id === id);
    if (index >= 0) {
      const s = this.solicitudes[index];
      this.solicitudes[index] = {
        ...s,
        calificada: true,
        calificacion: cal,
      };
    }
    return of(cal).pipe(delay(this.latenciaMs));
  }
}
