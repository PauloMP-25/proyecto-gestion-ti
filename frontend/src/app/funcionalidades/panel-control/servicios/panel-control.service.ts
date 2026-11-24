import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';
import { TicketResumen } from '../../../compartido/modelos/ticket-resumen.model';
import {
  KpiIndicador,
  TendenciaServicioClinico,
  DistribucionTipo,
  CargaTurnosDia,
  EstadoInventarioEquipos,
} from '../modelos/kpi.model';
import { TicketsService } from '../../../compartido/servicios/tickets/tickets.service';
import { API_ENDPOINTS } from '../../../nucleo/config/api-endpoints';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PanelControlService implements OnDestroy {
  private readonly ticketsService = inject(TicketsService);
  private readonly http = inject(HttpClient);

  // Estado reactivo de tickets reales conectados a la API
  private readonly _tickets = signal<TicketResumen[]>([]);
  readonly tickets = this._tickets.asReadonly();

  // Estado reactivo de inventario de equipos y contingencia
  private readonly _totalEquipos = signal<number>(45);
  private readonly _equiposEnServicio = signal<number>(34);
  private readonly _equiposEnPrestamo = signal<number>(5);
  private readonly _equiposEnMantenimiento = signal<number>(3);
  private readonly _equiposEnReserva = signal<number>(3);

  // Datos consolidados calculados directamente por el backend
  private readonly _metricasBackend = signal<any | null>(null);
  readonly metricasBackend = this._metricasBackend.asReadonly();

  // Filtro de búsqueda y chips
  readonly filtroTexto = signal<string>('');
  readonly filtroChip = signal<string>('todos');

  // Período de tendencia de incidentes (Hoy, 7D, 30D)
  readonly periodoSeleccionado = signal<'hoy' | '7d' | '30d'>('hoy');

  // Última actualización
  readonly ultimaActualizacion = signal<Date>(new Date());

  // Intervalo de sondeo automático en vivo
  private sondeoTimer: any = null;

  constructor() {
    this.refrescarDatos();

    // Sondeo automático cada 20 segundos para mantener la sala y NOC sincronizados al momento
    this.sondeoTimer = setInterval(() => {
      this.refrescarDatos();
    }, environment.sondeoBandejaMs || 20000);
  }

  ngOnDestroy(): void {
    if (this.sondeoTimer) {
      clearInterval(this.sondeoTimer);
      this.sondeoTimer = null;
    }
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

  // Métricas operativas calculadas a partir del backend
  readonly kpis = computed<KpiIndicador[]>(() => {
    const backend = this._metricasBackend();
    const todos = this._tickets();
    const abiertos = backend ? backend.ticketsAbiertos : todos.filter(t => t.estado === EstadoTicket.NUEVO || t.estado === EstadoTicket.ASIGNADO || t.estado === EstadoTicket.EN_PROCESO).length;
    const resueltos = backend ? backend.ticketsResueltos : todos.filter(t => t.estado === EstadoTicket.RESUELTO || t.estado === EstadoTicket.CERRADO).length;
    const cumplimientoPct = backend ? Number(backend.cumplimientoSlaPorcentaje).toFixed(1) : (todos.length > 0 ? ((todos.filter(t => t.slaResolucion?.estado === EstadoSLA.A_TIEMPO).length / todos.length) * 100).toFixed(1) : '100.0');

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
        valor: backend ? backend.tiempoPromedioRespuestaMinutos : '8.5',
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

  // Tendencia de incidentes por servicio clínico: 100% calculada por el backend con las Áreas reales de la BD
  readonly tendenciasPorServicio = computed<TendenciaServicioClinico[]>(() => {
    const backend = this._metricasBackend();
    if (backend && backend.incidentesPorArea && backend.incidentesPorArea.length > 0) {
      return backend.incidentesPorArea.map((item: any) => ({
        servicio: item.etiqueta,
        totalIncidentes: item.valor,
        statIncidentes: 0,
        porcentaje: item.porcentaje,
      }));
    }

    const todos = this._tickets();
    const mapa = new Map<string, number>();
    for (const t of todos) {
      const area = t.areaClinica || 'General';
      mapa.set(area, (mapa.get(area) || 0) + 1);
    }
    const total = Math.max(1, todos.length);
    const resultado: TendenciaServicioClinico[] = [];
    const entradas = Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    for (const [servicio, cuenta] of entradas) {
      resultado.push({
        servicio,
        totalIncidentes: cuenta,
        statIncidentes: 0,
        porcentaje: Math.round((cuenta / total) * 100),
      });
    }
    return resultado;
  });

  // Distribución taxonómica calculada por el backend
  readonly distribucionPorTipo = computed<DistribucionTipo[]>(() => {
    const backend = this._metricasBackend();
    if (backend && backend.fallasPorActivo && backend.fallasPorActivo.length > 0) {
      return backend.fallasPorActivo.map((item: any) => ({
        categoria: item.etiqueta,
        porcentaje: item.porcentaje,
        ejemplo: 'Infraestructura y activos reportados',
        casos: item.valor,
        icono: 'devices',
      }));
    }

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

  // NUEVO: Curva de Carga por Turnos (Mañana 07:00-13:00 vs. Tarde 13:00-19:00 de Lunes a Viernes)
  readonly cargaTurnosPorDia = computed<CargaTurnosDia[]>(() => {
    const backend = this._metricasBackend();
    if (backend && backend.cargaTurnos && backend.cargaTurnos.dias?.length) {
      const ct = backend.cargaTurnos;
      return ct.dias.map((dia: string, i: number) => ({
        dia,
        diaCorto: dia.substring(0, 3),
        turnoManana: ct.turnoManana[i] || 0,
        turnoTarde: ct.turnoTarde[i] || 0,
        total: ct.totales[i] || 0,
      }));
    }

    const todos = this._tickets();
    const dias: { nombre: string; corto: string; diaIndex: number }[] = [
      { nombre: 'Lunes', corto: 'Lun', diaIndex: 1 },
      { nombre: 'Martes', corto: 'Mar', diaIndex: 2 },
      { nombre: 'Miércoles', corto: 'Mié', diaIndex: 3 },
      { nombre: 'Jueves', corto: 'Jue', diaIndex: 4 },
      { nombre: 'Viernes', corto: 'Vie', diaIndex: 5 },
    ];

    const acumuladores = dias.map(d => ({
      dia: d.nombre,
      diaCorto: d.corto,
      turnoManana: 0,
      turnoTarde: 0,
      total: 0,
    }));

    for (const t of todos) {
      if (!t.fechaCreacion) continue;
      const f = new Date(t.fechaCreacion);
      const diaSemana = f.getDay();
      const hora = f.getHours();

      let idx = diaSemana - 1;
      if (idx < 0 || idx > 4) {
        idx = diaSemana === 0 ? 4 : 0;
      }

      if (hora >= 7 && hora < 13) {
        acumuladores[idx].turnoManana++;
      } else {
        acumuladores[idx].turnoTarde++;
      }
      acumuladores[idx].total++;
    }

    return acumuladores;
  });

  // NUEVO: Disponibilidad y Estado del Inventario de Equipos (Opción 3)
  readonly estadoInventario = computed<EstadoInventarioEquipos>(() => {
    const backend = this._metricasBackend();
    if (backend && backend.inventarioEquipos) {
      return backend.inventarioEquipos;
    }

    const total = this._totalEquipos();
    const prestamo = this._equiposEnPrestamo();
    const mant = this._equiposEnMantenimiento();
    const reserva = this._equiposEnReserva();
    const enServicio = Math.max(0, total - prestamo - mant - reserva);

    return {
      total,
      enServicio,
      enPrestamo: prestamo,
      enMantenimiento: mant,
      disponiblesReserva: reserva,
    };
  });

  refrescarDatos(): void {
    // 1. Consultar métricas y analítica calculada en el backend
    this.http.get<any>(API_ENDPOINTS.indicadores.dashboard).subscribe({
      next: (dashboard) => {
        this._metricasBackend.set(dashboard);
        if (dashboard?.inventarioEquipos) {
          const inv = dashboard.inventarioEquipos;
          this._totalEquipos.set(inv.total);
          this._equiposEnServicio.set(inv.enServicio);
          this._equiposEnPrestamo.set(inv.enPrestamo);
          this._equiposEnMantenimiento.set(inv.enMantenimiento);
          this._equiposEnReserva.set(inv.disponiblesReserva);
        }
        this.ultimaActualizacion.set(new Date());
      },
      error: () => {
        // Mantener resiliencia
      }
    });

    // 2. Consultar lista reactiva de tickets
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
        this.ultimaActualizacion.set(new Date());
      },
    });
  }

  cargarDatosInventario(): void {
    // Redirige al cálculo centralizado del backend
    this.refrescarDatos();
  }

  agregarTicket(nuevoTicket: TicketResumen): void {
    this._tickets.update(lista => [nuevoTicket, ...lista]);
    this.refrescarDatos();
  }
}
