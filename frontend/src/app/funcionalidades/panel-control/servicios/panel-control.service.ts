import { Injectable, signal, computed } from '@angular/core';
import { PrioridadTicket } from '../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../compartido/modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../compartido/modelos/estado-sla.enum';
import { TicketResumen } from '../../../compartido/modelos/ticket-resumen.model';
import { KpiIndicador, TendenciaServicioClinico, DistribucionTipo } from '../modelos/kpi.model';

@Injectable({
  providedIn: 'root',
})
export class PanelControlService {
  // Estado reactivo de tickets (Mock enriquecido de más de 25 tickets con áreas 24h del Hospital)
  private readonly _tickets = signal<TicketResumen[]>(this.generarTicketsIniciales());
  readonly tickets = this._tickets.asReadonly();

  // Filtro de búsqueda y chips
  readonly filtroTexto = signal<string>('');
  readonly filtroChip = signal<string>('todos');

  // Período de tendencia de incidentes (Hoy, 7D, 30D)
  readonly periodoSeleccionado = signal<'hoy' | '7d' | '30d'>('hoy');

  // Última actualización
  readonly ultimaActualizacion = signal<Date>(new Date());

  // Tickets filtrados calculados
  readonly ticketsFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const chip = this.filtroChip();
    let lista = this._tickets();

    // Filtro por Chip
    if (chip === 'p1') {
      lista = lista.filter(t => t.prioridad === PrioridadTicket.P1);
    } else if (chip === 'sla_riesgo') {
      lista = lista.filter(t => t.slaResolucion.estado === EstadoSLA.ALERTA || t.slaResolucion.estado === EstadoSLA.INCUMPLIDO);
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
      return new Date(a.slaResolucion.fechaVencimiento).getTime() - new Date(b.slaResolucion.fechaVencimiento).getTime();
    });
  });

  // Los 7 KPIs ITIL v4 del Capítulo IX
  readonly kpis = signal<KpiIndicador[]>([
    {
      id: 'kpi-01',
      codigo: 'KPI-01',
      titulo: 'Cumplimiento SLA Global',
      valor: '98.4',
      unidad: '%',
      meta: '95.0%',
      comparador: '≥',
      estado: 'CUMPLE',
      tendenciaTexto: '+3.4% sobre meta',
      tendenciaPositiva: true,
      formula: '(tickets resueltos a tiempo / tickets cerrados) × 100',
      alcance: 'Compromiso institucional de atención asistencial',
    },
    {
      id: 'kpi-02',
      codigo: 'KPI-02',
      titulo: 'Tickets Abiertos en Cola',
      valor: 26,
      unidad: 'casos',
      meta: '30 casos',
      comparador: '≤',
      estado: 'CUMPLE',
      tendenciaTexto: '+5% vs sem. ant.',
      tendenciaPositiva: false,
      formula: 'Total de tickets en estado NUEVO, ASIGNADO y EN_PROCESO',
      alcance: 'Carga viva en guardia 24/7',
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
      tendenciaTexto: 'UCI STAT: 2.1m',
      tendenciaPositiva: true,
      formula: 'Σ(hora asignación − hora registro) / tickets atendidos',
      alcance: 'Tiempo máximo de tolerancia: 15 min en áreas críticas',
    },
    {
      id: 'kpi-04',
      codigo: 'KPI-04',
      titulo: 'Resueltos Hoy',
      valor: 142,
      unidad: 'casos',
      meta: '150 casos',
      comparador: '≥',
      estado: 'CUMPLE',
      tendenciaTexto: 'Tasa 94.2%',
      tendenciaPositiva: true,
      formula: 'Total tickets en estado RESUELTO durante el día calendario',
    },
    {
      id: 'kpi-05',
      codigo: 'KPI-05',
      titulo: 'Resolución en 1er Contacto (FCR)',
      valor: '72.4',
      unidad: '%',
      meta: '65.0%',
      comparador: '≥',
      estado: 'CUMPLE',
      tendenciaTexto: '+7.4% sobre meta',
      tendenciaPositiva: true,
      formula: '(resueltos por N1 en 1er contacto / total atendidos por N1) × 100',
    },
    {
      id: 'kpi-06',
      codigo: 'KPI-06',
      titulo: 'Disponibilidad Serv. Críticos',
      valor: '99.8',
      unidad: '%',
      meta: '99.5%',
      comparador: '≥',
      estado: 'CUMPLE',
      tendenciaTexto: '99.9% EMR Clínico',
      tendenciaPositiva: true,
      formula: '((tiempo total − indisponibilidad) / tiempo total) × 100',
      alcance: 'Alcance: servicios críticos 24/7 (HIS, Laboratorio, Farmacia, Triaje)',
    },
    {
      id: 'kpi-07',
      codigo: 'KPI-07',
      titulo: 'Satisfacción Asistencial (CSAT)',
      valor: '91.2',
      unidad: '%',
      meta: '85.0%',
      comparador: '≥',
      estado: 'CUMPLE',
      tendenciaTexto: '+6.2% vs objetivo',
      tendenciaPositiva: true,
      formula: '(encuestas positivas / encuestas respondidas) × 100',
    },
  ]);

  // Tendencia de incidentes por servicio clínico asistencial
  readonly tendenciasPorServicio = signal<TendenciaServicioClinico[]>([
    { servicio: 'Centro Quirúrgico & Recuperación', totalIncidentes: 14, statIncidentes: 2, porcentaje: 65 },
    { servicio: 'Unidad de Cuidados Intensivos (UCI)', totalIncidentes: 19, statIncidentes: 3, porcentaje: 85 },
    { servicio: 'Emergencia y Tópicos de Triaje', totalIncidentes: 26, statIncidentes: 1, porcentaje: 95 },
    { servicio: 'Laboratorio Clínico y Banco de Sangre', totalIncidentes: 11, statIncidentes: 0, porcentaje: 50 },
    { servicio: 'Farmacia Central & Consultorios', totalIncidentes: 8, statIncidentes: 0, porcentaje: 35 },
  ]);

  // Distribución taxonómica por tipo de falla
  readonly distribucionPorTipo = signal<DistribucionTipo[]>([
    {
      categoria: 'Software Clínico (EHR/HIS)',
      porcentaje: 42,
      ejemplo: 'Historia Clínica Electrónica',
      casos: 16,
      icono: 'clinical_notes',
    },
    {
      categoria: 'Biomecatrónica & Monitores',
      porcentaje: 28,
      ejemplo: 'Multiparámetros, Bombas de Infusión',
      casos: 11,
      icono: 'ecg_heart',
    },
    {
      categoria: 'Redes & Conectividad VLAN',
      porcentaje: 18,
      ejemplo: 'VLAN Médica, APs Quirófano',
      casos: 7,
      icono: 'lan',
    },
    {
      categoria: 'Hardware / Periféricos',
      porcentaje: 12,
      ejemplo: 'Impresoras SIS, Ficheros, Lectores',
      casos: 5,
      icono: 'devices',
    },
  ]);

  refrescarDatos(): void {
    this.ultimaActualizacion.set(new Date());
  }

  private generarTicketsIniciales(): TicketResumen[] {
    const ahora = Date.now();
    const crearFechaRelativa = (minutosRestantes: number, duracionTotalMinutos: number = 60) => {
      const inicio = new Date(ahora - (duracionTotalMinutos - minutosRestantes) * 60000).toISOString();
      const vencimiento = new Date(ahora + minutosRestantes * 60000).toISOString();
      let estado = EstadoSLA.A_TIEMPO;
      if (minutosRestantes <= 0) {
        estado = EstadoSLA.INCUMPLIDO;
      } else if (minutosRestantes <= duracionTotalMinutos * 0.2) {
        estado = EstadoSLA.ALERTA;
      }
      return {
        fechaInicio: inicio,
        fechaVencimiento: vencimiento,
        estado,
        porcentajeConsumido: Math.max(0, Math.min(100, Math.round(((duracionTotalMinutos - minutosRestantes) / duracionTotalMinutos) * 100))),
        tiempoRestanteMinutos: minutosRestantes,
      };
    };

    return [
      {
        id: '1',
        codigo: 'TK-1082',
        tipo: 'INCIDENTE',
        titulo: 'Caída de enlace en Tópico de Triaje & Fibra Local',
        areaClinica: 'Emergencia Adultos',
        activoAfectado: { nombre: 'SW-TRIAGE-01', ip: '192.168.12.1', tipo: 'Switch de Borde' },
        prioridad: PrioridadTicket.P1,
        estado: EstadoTicket.EN_PROCESO,
        nivelActual: 'N1',
        responsable: { id: 'USR-02', nombre: 'Carlos Huamán (Practicante)' },
        slaResolucion: crearFechaRelativa(14, 60),
        fechaCreacion: new Date(ahora - 46 * 60000).toISOString(),
        esCriticoStat: true,
      },
      {
        id: '2',
        codigo: 'TK-1081',
        tipo: 'INCIDENTE',
        titulo: 'Falla de firma digital EMR & Token Médico no detectado',
        areaClinica: 'UCI Coronaria',
        activoAfectado: { nombre: 'LAP-UCI-02', ip: '192.168.10.112', tipo: 'Laptop Asistencial' },
        prioridad: PrioridadTicket.P1,
        estado: EstadoTicket.EN_PROCESO,
        nivelActual: 'N1',
        responsable: { id: 'USR-03', nombre: 'Téc. R. Flores' },
        slaResolucion: crearFechaRelativa(22, 60),
        fechaCreacion: new Date(ahora - 38 * 60000).toISOString(),
        esCriticoStat: true,
      },
      {
        id: '3',
        codigo: 'TK-1079',
        tipo: 'INCIDENTE',
        titulo: 'Falla de impresora SIS para FUA & Fichas de Atención',
        areaClinica: 'Admisión SIS',
        activoAfectado: { nombre: 'PC-ADM04', ip: '192.168.10.45', tipo: 'Impresora Matricial' },
        prioridad: PrioridadTicket.P2,
        estado: EstadoTicket.ASIGNADO,
        nivelActual: 'N1',
        responsable: { id: 'USR-02', nombre: 'Carlos Huamán (Practicante)' },
        slaResolucion: crearFechaRelativa(32, 120),
        fechaCreacion: new Date(ahora - 88 * 60000).toISOString(),
      },
      {
        id: '4',
        codigo: 'TK-1075',
        tipo: 'INCIDENTE',
        titulo: 'Problema lector código de barras - Despacho de Insumos',
        areaClinica: 'Farmacia Central',
        activoAfectado: { nombre: 'PC-FARM02', ip: '192.168.14.88', tipo: 'Lector Óptico' },
        prioridad: PrioridadTicket.P2,
        estado: EstadoTicket.EN_PROCESO,
        nivelActual: 'N1',
        responsable: { id: 'USR-03', nombre: 'Téc. R. Flores' },
        slaResolucion: crearFechaRelativa(75, 120),
        fechaCreacion: new Date(ahora - 45 * 60000).toISOString(),
      },
      {
        id: '5',
        codigo: 'TK-1068',
        tipo: 'SOLICITUD',
        titulo: 'Configuración cliente LIMS para hemogramas automatizados',
        areaClinica: 'Laboratorio Clínico',
        activoAfectado: { nombre: 'PC-LAB-05', ip: '192.168.16.20', tipo: 'Estación de Trabajo' },
        prioridad: PrioridadTicket.P3,
        estado: EstadoTicket.ASIGNADO,
        nivelActual: 'N1',
        responsable: { id: 'USR-02', nombre: 'Carlos Huamán (Practicante)' },
        slaResolucion: crearFechaRelativa(240, 480),
        fechaCreacion: new Date(ahora - 240 * 60000).toISOString(),
      },
      {
        id: '6',
        codigo: 'TK-1064',
        tipo: 'INCIDENTE',
        titulo: 'Monitor Multiparámetro sin enlace a estación central',
        areaClinica: 'Centro Quirúrgico & Recuperación',
        activoAfectado: { nombre: 'MON-QX-03', ip: '192.168.18.15', tipo: 'Monitor Asistencial' },
        prioridad: PrioridadTicket.P1,
        estado: EstadoTicket.ASIGNADO,
        nivelActual: 'N2',
        responsable: { id: 'USR-01', nombre: 'Ing. Roberto Ramos (Admin)' },
        slaResolucion: crearFechaRelativa(18, 60),
        fechaCreacion: new Date(ahora - 42 * 60000).toISOString(),
        esCriticoStat: true,
      },
      {
        id: '7',
        codigo: 'TK-1060',
        tipo: 'INCIDENTE',
        titulo: 'Lentitud severa en módulo de egresos y facturación SIS',
        areaClinica: 'Caja y Facturación Central',
        activoAfectado: { nombre: 'SRV-FACT-01', ip: '192.168.1.50', tipo: 'Servidor Base' },
        prioridad: PrioridadTicket.P2,
        estado: EstadoTicket.EN_PROCESO,
        nivelActual: 'N2',
        responsable: { id: 'USR-01', nombre: 'Ing. Roberto Ramos (Admin)' },
        slaResolucion: crearFechaRelativa(-15, 120), // Vencido hace 15m
        fechaCreacion: new Date(ahora - 135 * 60000).toISOString(),
      },
      {
        id: '8',
        codigo: 'TK-1055',
        tipo: 'SOLICITUD',
        titulo: 'Habilitación de anexo IP y acceso a correo asistencial',
        areaClinica: 'Consultorio de Pediatría',
        activoAfectado: { nombre: 'TEL-PED-01', ip: '192.168.20.12', tipo: 'Teléfono IP' },
        prioridad: PrioridadTicket.P3,
        estado: EstadoTicket.NUEVO,
        nivelActual: 'N1',
        slaResolucion: crearFechaRelativa(320, 480),
        fechaCreacion: new Date(ahora - 160 * 60000).toISOString(),
      },
      {
        id: '9',
        codigo: 'TK-1051',
        tipo: 'SOLICITUD',
        titulo: 'Reemplazo de tóner y mantenimiento preventivo',
        areaClinica: 'Archivo y Estadística',
        activoAfectado: { nombre: 'IMP-EST-01', ip: '192.168.22.4', tipo: 'Impresora Láser' },
        prioridad: PrioridadTicket.P4,
        estado: EstadoTicket.ASIGNADO,
        nivelActual: 'N1',
        responsable: { id: 'USR-02', nombre: 'Carlos Huamán (Practicante)' },
        slaResolucion: crearFechaRelativa(800, 1440),
        fechaCreacion: new Date(ahora - 640 * 60000).toISOString(),
      },
      {
        id: '10',
        codigo: 'TK-1048',
        tipo: 'INCIDENTE',
        titulo: 'Bomba de Infusión reporta desconexión intermitente',
        areaClinica: 'Unidad de Cuidados Intensivos (UCI)',
        activoAfectado: { nombre: 'BOM-UCI-05', ip: '192.168.10.89', tipo: 'Bomba Infusión' },
        prioridad: PrioridadTicket.P1,
        estado: EstadoTicket.RESUELTO,
        nivelActual: 'N1',
        responsable: { id: 'USR-03', nombre: 'Téc. R. Flores' },
        slaResolucion: crearFechaRelativa(120, 60),
        fechaCreacion: new Date(ahora - 300 * 60000).toISOString(),
      },
    ];
  }
}
