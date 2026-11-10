import { Injectable, inject, signal } from '@angular/core';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { 
  CategoriaTicket, 
  ContextoEquipoDetectado, 
  EstimacionSLA, 
  NivelImpacto, 
  NivelUrgencia, 
  NuevaSolicitudPayload, 
  SolicitudRegistradaRespuesta, 
  TipoTicket 
} from '../modelos/solicitud.model';
import { PanelControlService } from '../../panel-control/servicios/panel-control.service';
import { TicketResumen } from '../../../compartido/modelos/ticket-resumen.model';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';

@Injectable({
  providedIn: 'root'
})
export class SolicitudesService {
  private panelControlService = inject(PanelControlService);

  private correlativoActual = 42;

  // Categorías hospitalarias oficiales según taxonomía ITIL v4 de la CMDB
  readonly categorias: CategoriaTicket[] = [
    {
      id: 'cat-software',
      nombre: 'Software Asistencial (EHR / GALENHOS / HIS)',
      descripcion: 'Fallas en sistema clínico, módulo de recetas, errores de conexión a base de datos',
      icono: 'terminal',
      ejemplos: ['Error de bloqueo en Galenhos', 'No carga módulo de Farmacia', 'Error al emitir FUA SIS']
    },
    {
      id: 'cat-hardware',
      nombre: 'Estaciones PC, Impresoras y Periféricos',
      descripcion: 'Impresoras térmicas de tickets, computadoras lentas o congeladas, lectores de barras',
      icono: 'print',
      ejemplos: ['Impresora SIS trabada', 'PC no enciende en Triaje', 'Lector de código no lee DNI']
    },
    {
      id: 'cat-red',
      nombre: 'Redes, Conectividad y Fibra Óptica',
      descripcion: 'Caída de Internet, desconexión de red LAN, problemas con switches o cableado',
      icono: 'wifi_tethering',
      ejemplos: ['Sin conexión de red en Tópico', 'Enlace caído en Consultorios', 'VLAN aislada']
    },
    {
      id: 'cat-accesos',
      nombre: 'Cuentas, Accesos y Firma Digital',
      descripcion: 'Bloqueo de usuario de Windows/Galenhos, problemas con token o firma digital Reniec',
      icono: 'key',
      ejemplos: ['Token de firma digital no detectado', 'Usuario bloqueado en Galenhos', 'Cambio de clave']
    },
    {
      id: 'cat-contingencia',
      nombre: 'Solicitud de Equipo de Contingencia',
      descripcion: 'Préstamo temporal de laptop o impresora para áreas críticas 24/7 en emergencia',
      icono: 'swap_horiz',
      ejemplos: ['Laptop temporal para Triaje', 'Impresora de respaldo para Admisión']
    }
  ];

  // Detección automática del contexto del equipo del cliente (Simula GET /api/contexto-cliente)
  obtenerContextoDetectado(): ContextoEquipoDetectado {
    return {
      ip: '10.20.4.15',
      hostname: 'HSP-ADM-01',
      area: 'Admisión Central & Triaje',
      anexo: '2400',
      detectadoAutomatico: true,
      activoCMDBId: 'PC-ADM-001'
    };
  }

  // Algoritmo de cálculo de Prioridad y SLA según Matriz ITIL v4 del Hospital
  calcularPrioridadYSla(impacto: NivelImpacto, urgencia: NivelUrgencia): EstimacionSLA {
    if (impacto === 'ALTO' && urgencia === 'ALTA') {
      return {
        prioridad: PrioridadTicket.P1,
        prioridadNombre: 'P1 · Crítica (STAT)',
        colorClase: 'p1-critica',
        tiempoRespuestaMin: 15,
        tiempoResolucionMin: 60,
        textoRespuesta: '≤ 15 minutos (Inmediato)',
        textoResolucion: '≤ 60 minutos (Máxima urgencia)'
      };
    }

    if ((impacto === 'ALTO' && urgencia === 'MEDIA') || (impacto === 'MEDIO' && urgencia === 'ALTA')) {
      return {
        prioridad: PrioridadTicket.P2,
        prioridadNombre: 'P2 · Alta',
        colorClase: 'p2-alta',
        tiempoRespuestaMin: 30,
        tiempoResolucionMin: 120,
        textoRespuesta: '≤ 30 minutos',
        textoResolucion: '≤ 2 horas'
      };
    }

    if (
      (impacto === 'MEDIO' && urgencia === 'MEDIA') || 
      (impacto === 'ALTO' && urgencia === 'BAJA') || 
      (impacto === 'BAJO' && urgencia === 'ALTA')
    ) {
      return {
        prioridad: PrioridadTicket.P3,
        prioridadNombre: 'P3 · Media',
        colorClase: 'p3-media',
        tiempoRespuestaMin: 60,
        tiempoResolucionMin: 480,
        textoRespuesta: '≤ 1 hora',
        textoResolucion: '≤ 8 horas (Turno operativo)'
      };
    }

    // P4 Baja por descarte
    return {
      prioridad: PrioridadTicket.P4,
      prioridadNombre: 'P4 · Baja',
      colorClase: 'p4-baja',
      tiempoRespuestaMin: 120,
      tiempoResolucionMin: 1440,
      textoRespuesta: '≤ 2 horas',
      textoResolucion: '≤ 24 horas (Requerimiento programado)'
    };
  }

  // Registrar y persistir en la cola activa
  registrarSolicitud(payload: NuevaSolicitudPayload): Promise<SolicitudRegistradaRespuesta> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.correlativoActual++;
        const prefijo = payload.tipo === 'incidente' ? 'INC' : 'REQ';
        const correlativoStr = String(this.correlativoActual).padStart(4, '0');
        const codigo = `${prefijo}-2026-${correlativoStr}`;
        const sla = this.calcularPrioridadYSla(payload.impacto, payload.urgencia);

        const nuevoTicket: TicketResumen = {
          id: `ticket-${this.correlativoActual}`,
          codigo: codigo,
          tipo: payload.tipo === 'incidente' ? 'INCIDENTE' : 'SOLICITUD',
          titulo: payload.titulo,
          areaClinica: payload.contextoEquipo.area,
          activoAfectado: {
            nombre: payload.contextoEquipo.hostname,
            ip: payload.contextoEquipo.ip,
            tipo: 'Estación de Trabajo'
          },
          prioridad: sla.prioridad,
          estado: EstadoTicket.NUEVO,
          nivelActual: 'N1',
          responsable: undefined,
          slaResolucion: {
            fechaInicio: new Date().toISOString(),
            fechaVencimiento: new Date(Date.now() + sla.tiempoResolucionMin * 60000).toISOString(),
            estado: EstadoSLA.A_TIEMPO,
            porcentajeConsumido: 0,
            tiempoRestanteMinutos: sla.tiempoResolucionMin,
          },
          fechaCreacion: new Date().toISOString(),
          esCriticoStat: sla.prioridad === PrioridadTicket.P1,
        };

        // Agregar al servicio central para que impacte en la Cola Activa del Panel
        this.panelControlService.agregarTicket(nuevoTicket);

        const respuesta: SolicitudRegistradaRespuesta = {
          id: nuevoTicket.id,
          codigo: codigo,
          titulo: payload.titulo,
          tipo: payload.tipo,
          prioridad: sla.prioridad,
          estado: 'NUEVO',
          fechaCreacion: new Date(),
          slaEstimado: sla,
          contextoEquipo: payload.contextoEquipo,
        };

        resolve(respuesta);
      }, 700);
    });
  }
}
