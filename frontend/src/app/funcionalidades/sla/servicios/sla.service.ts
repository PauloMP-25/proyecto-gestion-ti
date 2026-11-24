import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoSla } from '../../../compartido/modelos/estado-sla.enum';
import {
  ReglaSlaConfiguracion,
  MetricasSlaGlobal,
  CumplimientoSlaPorArea,
  TicketMonitoreoSla,
  ConfiguracionKpiItem,
  AreaPrioridadItem,
} from '../modelos/sla.model';
import { API_ENDPOINTS } from '../../../nucleo/config/api-endpoints';

@Injectable({
  providedIn: 'root',
})
export class SlaService {
  private readonly http = inject(HttpClient);

  // Metas dinámicas de KPIs institucionales configurables por el Administrador
  readonly metasKpis = signal<ConfiguracionKpiItem[]>([
    {
      codigo: 'KPI-01',
      titulo: 'Cumplimiento SLA Global',
      metaValor: 95.0,
      unidad: '%',
      comparador: '≥',
      formula: '(tickets resueltos a tiempo / tickets cerrados) × 100',
      descripcion: 'Porcentaje de tickets atendidos dentro del tiempo comprometido.',
    },
    {
      codigo: 'KPI-02',
      titulo: 'Tickets Abiertos en Cola',
      metaValor: 30,
      unidad: 'casos',
      comparador: '≤',
      formula: 'Total de tickets en estado NUEVO, ASIGNADO y EN_PROCESO',
      descripcion: 'Total de solicitudes e incidentes activos pendientes de atención técnica.',
    },
    {
      codigo: 'KPI-03',
      titulo: 'Tiempo Prom. Respuesta (TPR)',
      metaValor: 20,
      unidad: 'min',
      comparador: '≤',
      formula: 'Σ(hora asignación − hora registro) / tickets atendidos',
      descripcion: 'Tiempo promedio que demora el equipo de TI en tomar el ticket tras ser reportado.',
    },
    {
      codigo: 'KPI-04',
      titulo: 'Resueltos en el Turno',
      metaValor: 150,
      unidad: 'casos',
      comparador: '≥',
      formula: 'Total tickets en estado RESUELTO o CERRADO',
      descripcion: 'Cantidad de casos solucionados satisfactoriamente.',
    },
  ]);
  // Reglas vigentes de tiempos de respuesta y resolución pactadas con el hospital
  readonly reglasSla = signal<ReglaSlaConfiguracion[]>([
    {
      prioridad: PrioridadTicket.P1,
      nombre: 'Crítica (STAT)',
      tiempoRespuestaMin: 15,
      tiempoResolucionMin: 60,
      colorClase: 'p1-critica',
      aplicaHorarioLaboral: false, // 24/7 sin excepción
      notificarJefaturaMin: 20,
      descripcionHospitalaria: 'Soporte vital inmediato: Fallas en Shock Trauma, UCI, Servidor HIS o Tomógrafo.',
    },
    {
      prioridad: PrioridadTicket.P2,
      nombre: 'Alta',
      tiempoRespuestaMin: 30,
      tiempoResolucionMin: 120,
      colorClase: 'p2-alta',
      aplicaHorarioLaboral: false,
      notificarJefaturaMin: 45,
      descripcionHospitalaria: 'Afectación a todo un servicio asistencial: Farmacia central, Triaje o Admisión.',
    },
    {
      prioridad: PrioridadTicket.P3,
      nombre: 'Media',
      tiempoRespuestaMin: 60,
      tiempoResolucionMin: 480, // 8 horas
      colorClase: 'p3-media',
      aplicaHorarioLaboral: true,
      notificarJefaturaMin: 120,
      descripcionHospitalaria: 'Degradación parcial en consultorios externos o terminales de enfermería.',
    },
    {
      prioridad: PrioridadTicket.P4,
      nombre: 'Baja',
      tiempoRespuestaMin: 120,
      tiempoResolucionMin: 1440, // 24 horas
      colorClase: 'p4-baja',
      aplicaHorarioLaboral: true,
      notificarJefaturaMin: 360,
      descripcionHospitalaria: 'Solicitud administrativa o estación no asistencial.',
    },
  ]);

  // Métricas globales hospitalarias
  readonly metricasGlobales = signal<MetricasSlaGlobal>({
    porcentajeCumplimientoGlobal: 91.8,
    totalTicketsEvaluados: 128,
    ticketsCumplidos: 114,
    ticketsEnAlerta: 8,
    ticketsIncumplidos: 6,
    tiempoPromedioRespuestaMin: 18,
    tiempoPromedioResolucionMin: 85,
  });

  // Cumplimiento desagregado por áreas asistenciales
  readonly cumplimientoPorArea = signal<CumplimientoSlaPorArea[]>([
    {
      idArea: 1,
      areaNombre: 'Emergencia y Cuidados Críticos',
      totalTickets: 42,
      cumplidos: 39,
      porcentajeCumplimiento: 92.8,
      estadoGeneral: EstadoSla.A_TIEMPO,
    },
    {
      idArea: 3,
      areaNombre: 'Unidad de Cuidados Intensivos (UCI)',
      totalTickets: 18,
      cumplidos: 18,
      porcentajeCumplimiento: 100.0,
      estadoGeneral: EstadoSla.A_TIEMPO,
    },
    {
      idArea: 4,
      areaNombre: 'Diagnóstico por Imágenes / Radiología',
      totalTickets: 25,
      cumplidos: 22,
      porcentajeCumplimiento: 88.0,
      estadoGeneral: EstadoSla.ALERTA,
    },
    {
      idArea: 5,
      areaNombre: 'Farmacia Hospitalaria',
      totalTickets: 28,
      cumplidos: 24,
      porcentajeCumplimiento: 85.7,
      estadoGeneral: EstadoSla.ALERTA,
    },
    {
      idArea: 2,
      areaNombre: 'Consulta Externa y Admisión',
      totalTickets: 15,
      cumplidos: 11,
      porcentajeCumplimiento: 73.3,
      estadoGeneral: EstadoSla.INCUMPLIDO,
    },
  ]);

  // Tickets activos bajo monitoreo en tiempo real
  readonly ticketsBajoMonitoreo = signal<TicketMonitoreoSla[]>([
    {
      id: 101,
      codigo: 'INC-2026-0104',
      titulo: 'Interrupción en visor DICOM de Tomografía',
      areaClinica: 'Diagnóstico por Imágenes',
      prioridad: PrioridadTicket.P1,
      estadoSla: EstadoSla.ALERTA,
      tiempoTotalMinutos: 60,
      minutosConsumidos: 48,
      minutosRestantes: 12, // <= 20% de 60m (12m)
      porcentajeConsumido: 80,
      fechaCreacion: new Date(Date.now() - 48 * 60000).toISOString(),
      fechaLimiteResolucion: new Date(Date.now() + 12 * 60000).toISOString(),
      tecnicoAsignado: 'Ing. Carlos Mendoza (N2)',
    },
    {
      id: 102,
      codigo: 'INC-2026-0108',
      titulo: 'Impresora térmica de Farmacia no imprime recetas SIS',
      areaClinica: 'Farmacia Central',
      prioridad: PrioridadTicket.P2,
      estadoSla: EstadoSla.A_TIEMPO,
      tiempoTotalMinutos: 120,
      minutosConsumidos: 40,
      minutosRestantes: 80,
      porcentajeConsumido: 33,
      fechaCreacion: new Date(Date.now() - 40 * 60000).toISOString(),
      fechaLimiteResolucion: new Date(Date.now() + 80 * 60000).toISOString(),
      tecnicoAsignado: 'Téc. Marco Aurelio (N1)',
    },
    {
      id: 103,
      codigo: 'INC-2026-0099',
      titulo: 'Fallo de conectividad en módulo de Triaje Adultos 01',
      areaClinica: 'Emergencia',
      prioridad: PrioridadTicket.P1,
      estadoSla: EstadoSla.A_TIEMPO,
      tiempoTotalMinutos: 60,
      minutosConsumidos: 20,
      minutosRestantes: 40,
      porcentajeConsumido: 33,
      fechaCreacion: new Date(Date.now() - 20 * 60000).toISOString(),
      fechaLimiteResolucion: new Date(Date.now() + 40 * 60000).toISOString(),
      tecnicoAsignado: 'Ing. Carlos Mendoza (N2)',
    },
    {
      id: 104,
      codigo: 'INC-2026-0085',
      titulo: 'Lentitud extrema en facturación de Admisión',
      areaClinica: 'Admisión Central',
      prioridad: PrioridadTicket.P3,
      estadoSla: EstadoSla.INCUMPLIDO,
      tiempoTotalMinutos: 480,
      minutosConsumidos: 510,
      minutosRestantes: 0,
      porcentajeConsumido: 106,
      fechaCreacion: new Date(Date.now() - 510 * 60000).toISOString(),
      fechaLimiteResolucion: new Date(Date.now() - 30 * 60000).toISOString(),
      tecnicoAsignado: 'Téc. Rosa Suárez (N1)',
    },
  ]);

  constructor() {
    this.cargarConfiguracionApi();
    this.cargarMetasKpiApi();
    this.cargarReglasPersistidas();
  }

  // Evalúa el estado SLA conforme a la regla de negocio del skill control_sla:
  // - A_TIEMPO: tiempo restante > 20% del total
  // - ALERTA: tiempo restante <= 20% del total
  // - INCUMPLIDO: tiempo restante <= 0
  evaluarEstadoSla(minutosRestantes: number, minutosTotales: number): EstadoSla {
    if (minutosRestantes <= 0) {
      return EstadoSla.INCUMPLIDO;
    }
    const porcentajeRestante = (minutosRestantes / minutosTotales) * 100;
    if (porcentajeRestante <= 20) {
      return EstadoSla.ALERTA;
    }
    return EstadoSla.A_TIEMPO;
  }

  cargarConfiguracionApi(): void {
    this.http.get<ReglaSlaConfiguracion[]>(API_ENDPOINTS.sla.configuracion).subscribe({
      next: (remotas) => {
        if (Array.isArray(remotas) && remotas.length > 0) {
          this.reglasSla.set(remotas);
        }
      },
      error: () => {
        this.cargarReglasPersistidas();
      },
    });
  }

  cargarMetasKpiApi(): void {
    this.http.get<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion).subscribe({
      next: (metas) => {
        if (Array.isArray(metas) && metas.length > 0) {
          this.metasKpis.set(metas);
        }
      },
      error: () => {
        // Fallback a valores por defecto
      },
    });
  }

  actualizarReglasSla(nuevasReglas: ReglaSlaConfiguracion[]): void {
    this.reglasSla.set(nuevasReglas);
    try {
      localStorage.setItem('hsmsi_reglas_sla', JSON.stringify(nuevasReglas));
    } catch {
      // Ignorar fallo de storage
    }

    this.http.put<ReglaSlaConfiguracion[]>(API_ENDPOINTS.sla.configuracion, nuevasReglas).subscribe({
      next: () => { },
      error: () => { },
    });
  }

  actualizarMetasKpi(nuevasMetas: ConfiguracionKpiItem[]): void {
    this.metasKpis.set(nuevasMetas);
    try {
      localStorage.setItem('hsmsi_metas_kpi', JSON.stringify(nuevasMetas));
    } catch {
      // Ignorar fallo de storage
    }

    this.http.put<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion, nuevasMetas).subscribe({
      next: () => { },
      error: () => { },
    });
  }

  readonly areasPrioridad = signal<AreaPrioridadItem[]>([]);
  readonly cargandoAreas = signal<boolean>(false);

  cargarAreas(): void {
    this.cargandoAreas.set(true);
    this.http.get<any[]>(API_ENDPOINTS.admin.areas).subscribe({
      next: (areas) => {
        const mapeadas: AreaPrioridadItem[] = (areas || []).map((a) => ({
          id: a.id,
          nombre: a.nombre,
          piso: a.piso,
          anexo: a.anexo,
          activo: a.activo !== false,
          prioridadDefecto: a.prioridadDefecto || 'P3',
        }));
        this.areasPrioridad.set(mapeadas);
        this.cargandoAreas.set(false);
      },
      error: () => {
        this.cargandoAreas.set(false);
      },
    });
  }

  actualizarPrioridadArea(idArea: number, prioridad: string): Observable<any> {
    return this.http.patch(`${API_ENDPOINTS.admin.areas}/${idArea}/prioridad`, { prioridad }).pipe(
      tap(() => {
        this.areasPrioridad.update((areas) =>
          areas.map((a) => (a.id === idArea ? { ...a, prioridadDefecto: prioridad } : a))
        );
      })
    );
  }

  private cargarReglasPersistidas(): void {
    try {
      const guardadas = localStorage.getItem('hsmsi_reglas_sla');
      if (guardadas) {
        const parseadas = JSON.parse(guardadas) as ReglaSlaConfiguracion[];
        if (Array.isArray(parseadas) && parseadas.length > 0) {
          this.reglasSla.set(parseadas);
        }
      }
    } catch {
      // Usar valores por defecto
    }
  }
}
