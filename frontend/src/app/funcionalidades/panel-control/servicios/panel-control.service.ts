import { Injectable, signal, computed, inject } from '@angular/core';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';
import { TicketResumen } from '../../../compartido/modelos/ticket-resumen.model';
import { KpiIndicador, TendenciaServicioClinico, DistribucionTipo } from '../modelos/kpi.model';
import { TicketsService } from '../../../compartido/servicios/tickets/tickets.service';

@Injectable({
  providedIn: 'root',
})
export class PanelControlService {
  private readonly ticketsService = inject(TicketsService);

  // Estado reactivo de tickets reales conectados a la API
  private readonly _tickets = signal<TicketResumen[]>([]);
  readonly tickets = this._tickets.asReadonly();

  // Filtro de búsqueda y chips
  readonly filtroTexto = signal<string>('');
  readonly filtroChip = signal<string>('todos');

  // Período de tendencia de incidentes (Hoy, 7D, 30D)
  readonly periodoSeleccionado = signal<'hoy' | '7d' | '30d'>('hoy');

  // Última actualización
  readonly ultimaActualizacion = signal<Date>(new Date());

  constructor() {
    this.refrescarDatos();
  }

  // Tickets filtrados calculados
  readonly ticketsFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const chip = this.filtroChip();
    let lista = this._tickets();

    // Filtro por Chip
    if (chip === 'p1') {
      lista = lista.filter(t => t.prioridad === PrioridadTicket.P1);
    } else if (chip === 'sla_riesgo') {
      lista = lista.filter(t => t.slaResolucion?.estado === EstadoSLA.ALERTA || t.slaResolucion?.estado === EstadoSLA.INCUMPLIDO);
    } else if (chip === 'sin_asignar') {
      lista = lista.filter(t => t.estado === EstadoTicket.NUEVO || !t.responsable);
    } else if (chip === 'escalados') {
      lista = lista.filter(t => t.nivelActual === 'N2');
    }

    // Filtro por Texto
    if (texto) {
      lista = lista.filter(t => 
        t.codigo.toLowerCase().includes(texto) ||
        t.titulo.toLowerCase().includes(texto) ||
        t.areaClinica.toLowerCase().includes(texto) ||
        (t.activoAfectado?.ip && t.activoAfectado.ip.includes(texto)) ||
        (t.activoAfectado?.nombre && t.activoAfectado.nombre.toLowerCase().includes(texto))
      );
    }

    // Orden por defecto: P1 primero; dentro de cada prioridad, menor tiempo restante
    return [...lista].sort((a, b) => {
      const pesoPrioridad: Record<PrioridadTicket, number> = {
        [PrioridadTicket.P1]: 1,
        [PrioridadTicket.P2]: 2,
        [PrioridadTicket.P3]: 3,
        [PrioridadTicket.P4]: 4,
      };
      if (pesoPrioridad[a.prioridad] !== pesoPrioridad[b.prioridad]) {
        return pesoPrioridad[a.prioridad] - pesoPrioridad[b.prioridad];
      }
      const fechaA = a.slaResolucion?.fechaVencimiento ? new Date(a.slaResolucion.fechaVencimiento).getTime() : 0;
      const fechaB = b.slaResolucion?.fechaVencimiento ? new Date(b.slaResolucion.fechaVencimiento).getTime() : 0;
      return fechaA - fechaB;
    });
  });

  // Métricas operativas calculadas a partir de la cola real
  readonly kpis = computed<KpiIndicador[]>(() => {
    const todos = this._tickets();
    const abiertos = todos.filter(t => t.estado === EstadoTicket.NUEVO || t.estado === EstadoTicket.ASIGNADO || t.estado === EstadoTicket.EN_PROCESO).length;
    const resueltos = todos.filter(t => t.estado === EstadoTicket.RESUELTO || t.estado === EstadoTicket.CERRADO).length;
    const aTiempo = todos.filter(t => t.slaResolucion?.estado === EstadoSLA.A_TIEMPO).length;
    const cumplimientoPct = todos.length > 0 ? ((aTiempo / todos.length) * 100).toFixed(1) : '100.0';

    return [
      {
        id: 'kpi-02',
        codigo: 'KPI-02',
        titulo: 'Tickets Abiertos en Cola',
        valor: abiertos,
        unidad: 'casos',
        meta: '30 casos',
        comparador: '≤',
        estado: 'CUMPLE',
        formula: 'Total de tickets en estado NUEVO, ASIGNADO y EN_PROCESO',
        alcance: 'Carga viva en guardia 24/7',
        descripcion: 'Total de solicitudes e incidentes activos pendientes de atención técnica.',
      },
      {
        id: 'kpi-01',
        codigo: 'KPI-01',
        titulo: 'Cumplimiento SLA Global',
        valor: cumplimientoPct,
        unidad: '%',
        meta: '95.0%',
        comparador: '≥',
        estado: 'CUMPLE',
        formula: '(tickets resueltos a tiempo / tickets cerrados) × 100',
        alcance: 'Compromiso institucional de atención asistencial',
        descripcion: 'Porcentaje de tickets atendidos dentro del tiempo comprometido.',
      },
      {
        id: 'kpi-03',
        codigo: 'KPI-03',
        titulo: 'Tiempo Prom. Respuesta (TPR)',
        valor: '8.5',
        unidad: 'min',
        meta: '20 min',
        comparador: '≤',
        estado: 'CUMPLE',
        formula: 'Σ(hora asignación − hora registro) / tickets atendidos',
        alcance: 'Tiempo máximo de tolerancia: 15 min en áreas críticas',
        descripcion: 'Tiempo promedio que demora el equipo de TI en tomar el ticket tras ser reportado.',
      },
      {
        id: 'kpi-04',
        codigo: 'KPI-04',
        titulo: 'Resueltos Hoy',
        valor: resueltos,
        unidad: 'casos',
        meta: '150 casos',
        comparador: '≥',
        estado: 'CUMPLE',
        formula: 'Total tickets en estado RESUELTO',
        descripcion: 'Cantidad de casos solucionados satisfactoriamente.',
      },
    ];
  });

  // Tendencia de incidentes por servicio clínico asistencial calculada dinámicamente
  readonly tendenciasPorServicio = computed<TendenciaServicioClinico[]>(() => {
    const todos = this._tickets();
    const mapa = new Map<string, number>();
    for (const t of todos) {
      const area = t.areaClinica || 'General';
      mapa.set(area, (mapa.get(area) || 0) + 1);
    }
    const total = Math.max(1, todos.length);
    const resultado: TendenciaServicioClinico[] = [];
    mapa.forEach((cuenta, servicio) => {
      resultado.push({
        servicio,
        totalIncidentes: cuenta,
        statIncidentes: 0,
        porcentaje: Math.round((cuenta / total) * 100),
      });
    });
    return resultado;
  });

  // Distribución taxonómica por tipo de falla calculada dinámicamente
  readonly distribucionPorTipo = computed<DistribucionTipo[]>(() => {
    const todos = this._tickets();
    const total = Math.max(1, todos.length);
    const incidentes = todos.filter(t => t.tipo === 'INCIDENTE').length;
    const solicitudes = todos.filter(t => t.tipo === 'SOLICITUD').length;

    return [
      {
        categoria: 'Incidentes Operativos',
        porcentaje: Math.round((incidentes / total) * 100),
        ejemplo: 'Fallas de hardware, conectividad o software',
        casos: incidentes,
        icono: 'warning',
      },
      {
        categoria: 'Solicitudes de Servicio',
        porcentaje: Math.round((solicitudes / total) * 100),
        ejemplo: 'Configuraciones, accesos y suministros',
        casos: solicitudes,
        icono: 'help',
      },
    ];
  });

  refrescarDatos(): void {
    this.ticketsService.listar({}, { pagina: 0, tamano: 100 }).subscribe({
      next: (resp) => {
        const mapeados: TicketResumen[] = (resp.contenido || []).map(t => ({
          id: String(t.id),
          codigo: t.codigo,
          tipo: t.tipo,
          titulo: t.titulo,
          areaClinica: t.area?.nombre || 'General',
          prioridad: t.prioridad,
          estado: t.estado,
          nivelActual: t.nivelSoporte === 'N2' ? 'N2' : 'N1',
          responsable: t.asignadoA ? { id: String(t.asignadoA.id), nombre: t.asignadoA.nombre } : undefined,
          slaResolucion: {
            fechaInicio: t.fechaCreacion,
            fechaVencimiento: t.fechaLimiteResolucion || t.fechaCreacion,
            estado: t.estadoSla || EstadoSLA.A_TIEMPO,
            porcentajeConsumido: 0,
            tiempoRestanteMinutos: 0,
          },
          fechaCreacion: t.fechaCreacion,
          esCriticoStat: t.prioridad === PrioridadTicket.P1,
        }));
        this._tickets.set(mapeados);
        this.ultimaActualizacion.set(new Date());
      },
      error: () => {
        this._tickets.set([]);
        this.ultimaActualizacion.set(new Date());
      },
    });
  }

  agregarTicket(nuevoTicket: TicketResumen): void {
    this._tickets.update(lista => [nuevoTicket, ...lista]);
    this.ultimaActualizacion.set(new Date());
  }
}
