import { Area, Categoria, ContextoCliente, Tecnico } from '../../../modelos/ticket.dto';
import { Ticket, TicketResumen } from '../../../modelos/ticket.model';
import { EstadoTicket } from '../../../modelos/estado-ticket.enum';
import { EstadoSLA } from '../../../modelos/estado-sla.enum';
import { PrioridadTicket } from '../../../modelos/prioridad.enum';
import { NivelSoporte } from '../../../modelos/nivel-soporte.enum';
import { Impacto, Urgencia, TipoTicket } from '../../../modelos/impacto-urgencia.enum';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

export const AREAS_MOCK: Area[] = [
  { id: 1, nombre: 'Emergencia' },
  { id: 2, nombre: 'Admisión' },
  { id: 3, nombre: 'UCI' },
  { id: 4, nombre: 'Farmacia' },
  { id: 5, nombre: 'Laboratorio' },
  { id: 6, nombre: 'Consultorios Externos' },
];

export const CATEGORIAS_MOCK: Categoria[] = [
  { id: 1, nombre: 'Hardware y periféricos', idPadre: null },
  { id: 2, nombre: 'Software asistencial (GALENHOS)', idPadre: null },
  { id: 3, nombre: 'Conectividad / Red', idPadre: null },
  { id: 4, nombre: 'Cuentas y accesos', idPadre: null },
  { id: 5, nombre: 'Impresión', idPadre: null },
  { id: 6, nombre: 'Correo y ofimática', idPadre: null },
];

export const TECNICOS_MOCK: Tecnico[] = [
  { id: 8, nombreCompleto: 'Luis Quispe', rol: RolUsuario.PRACTICANTE, nivelSoporte: NivelSoporte.N1, ticketsAbiertos: 3 },
  { id: 9, nombreCompleto: 'María Torres', rol: RolUsuario.PRACTICANTE, nivelSoporte: NivelSoporte.N1, ticketsAbiertos: 2 },
  { id: 2, nombreCompleto: 'Ing. Carlos Mendoza', rol: RolUsuario.ADMINISTRADOR, nivelSoporte: NivelSoporte.N2, ticketsAbiertos: 1 },
];

export const CONTEXTO_MOCK: ContextoCliente = {
  ip: '192.168.10.24',
  hostname: 'PC-ADM-03',
  idArea: 2,
  area: 'Admisión',
  anexo: '2314',
  idEquipo: 14,
  ipRegistrada: true,
};

// Para probar el aviso de IP no registrada, usar este contexto en TicketsMockService.contextoCliente()
export const CONTEXTO_NO_REGISTRADO_MOCK: ContextoCliente = {
  ip: '192.168.99.120',
  hostname: null,
  idArea: null,
  area: null,
  anexo: null,
  idEquipo: null,
  ipRegistrada: false,
};

const AHORA = Date.now();

export function isoLima(ms: number): string {
  return new Date(ms - 5 * 3600_000).toISOString().slice(0, 19) + '-05:00';
}

// Simula la matriz del backend: el mock recalcula la prioridad como lo hará la API
const MATRIZ: Record<Impacto, Record<Urgencia, PrioridadTicket>> = {
  ALTO: { ALTA: PrioridadTicket.P1, MEDIA: PrioridadTicket.P1, BAJA: PrioridadTicket.P2 },
  MEDIO: { ALTA: PrioridadTicket.P1, MEDIA: PrioridadTicket.P2, BAJA: PrioridadTicket.P3 },
  BAJO: { ALTA: PrioridadTicket.P2, MEDIA: PrioridadTicket.P3, BAJA: PrioridadTicket.P4 },
};

export const TIEMPOS_SLA_MIN: Record<PrioridadTicket, { respuesta: number; resolucion: number }> = {
  P1: { respuesta: 15, resolucion: 120 },
  P2: { respuesta: 30, resolucion: 240 },
  P3: { respuesta: 120, resolucion: 480 },
  P4: { respuesta: 240, resolucion: 1440 },
};

export function prioridadDe(impacto: Impacto, urgencia: Urgencia): PrioridadTicket {
  return MATRIZ[impacto][urgencia];
}

const NOMBRES: Record<number, string> = {
  2: 'Ing. Carlos Mendoza',
  5: 'Dra. Rosa Mendoza Quispe',
  6: 'Jorge Salazar Yataco',
  7: 'Patricia Huamán Ríos',
  8: 'Luis Quispe',
  9: 'María Torres',
  10: 'Ana Cecilia Ramos',
  11: 'Miguel Ángel Torres',
};

interface ConfigTicket {
  titulo: string;
  tipo?: TipoTicket;
  area: number;
  categoria: number;
  impacto: Impacto;
  urgencia: Urgencia;
  estado: EstadoTicket;
  haceMin: number;
  solicitante: number;
  asignado?: number;
  sinEquipo?: boolean;
}

function construirTicket(id: number, c: ConfigTicket): Ticket {
  const prioridad = prioridadDe(c.impacto, c.urgencia);
  const tiempos = TIEMPOS_SLA_MIN[prioridad];
  const creacionMs = AHORA - c.haceMin * 60_000;
  const limiteRespuestaMs = creacionMs + tiempos.respuesta * 60_000;
  const limiteResolucionMs = creacionMs + tiempos.resolucion * 60_000;
  const area = AREAS_MOCK.find(a => a.id === c.area)!;
  const categoria = CATEGORIAS_MOCK.find(k => k.id === c.categoria)!;
  const solicitante = { id: c.solicitante, nombre: NOMBRES[c.solicitante] };
  const asignadoA = c.asignado ? { id: c.asignado, nombre: NOMBRES[c.asignado] } : null;
  const prefijo = c.tipo === 'SOLICITUD' ? 'SOL' : 'INC';
  const cerradoOResuelto = c.estado === EstadoTicket.RESUELTO || c.estado === EstadoTicket.CERRADO;
  const resolucionRealMs = cerradoOResuelto ? creacionMs + Math.floor(c.haceMin * 0.6) * 60_000 : null;

  let estadoSla: EstadoSLA;
  if (resolucionRealMs != null) {
    estadoSla = resolucionRealMs <= limiteResolucionMs ? EstadoSLA.A_TIEMPO : EstadoSLA.INCUMPLIDO;
  } else {
    const restanteMs = limiteResolucionMs - AHORA;
    estadoSla = restanteMs <= 0
      ? EstadoSLA.INCUMPLIDO
      : restanteMs <= tiempos.resolucion * 60_000 * 0.25
        ? EstadoSLA.ALERTA
        : EstadoSLA.A_TIEMPO;
  }

  const ticket: Ticket = {
    id,
    codigo: `${prefijo}-2026-${String(id).padStart(5, '0')}`,
    tipo: c.tipo ?? 'INCIDENTE',
    titulo: c.titulo,
    descripcion: `${c.titulo}. Reportado por el área de ${area.nombre}. Se requiere revisión del equipo técnico de la Mesa de Ayuda.`,
    categoria,
    impacto: c.impacto,
    urgencia: c.urgencia,
    prioridad,
    estado: c.estado,
    estadoSla,
    nivelSoporte: c.estado === EstadoTicket.ESCALADO ? NivelSoporte.N2 : NivelSoporte.N1,
    area,
    solicitante,
    asignadoA,
    equipo: c.sinEquipo ? null : { id: 100 + id, hostname: `PC-${area.nombre.slice(0, 3).toUpperCase()}-${String(id).padStart(2, '0')}`, ip: `192.168.${c.area}.${20 + id}` },
    ipOrigen: `192.168.${c.area}.${20 + id}`,
    anexoContacto: String(2300 + c.area),
    fechaCreacion: isoLima(creacionMs),
    fechaAsignacion: asignadoA ? isoLima(creacionMs + 8 * 60_000) : null,
    fechaLimiteRespuesta: isoLima(limiteRespuestaMs),
    fechaLimiteResolucion: isoLima(limiteResolucionMs),
    fechaRespuestaReal: asignadoA ? isoLima(creacionMs + 8 * 60_000) : null,
    fechaResolucionReal: resolucionRealMs != null ? isoLima(resolucionRealMs) : null,
    fechaCierre: c.estado === EstadoTicket.CERRADO ? isoLima(creacionMs + Math.floor(c.haceMin * 0.8) * 60_000) : null,
    historial: [{ fecha: isoLima(creacionMs), usuario: solicitante.nombre, estadoAnterior: null, estadoNuevo: EstadoTicket.NUEVO, comentario: 'Ticket registrado' }],
    escalamientos: [],
    soluciones: [],
  };

  if (asignadoA) {
    ticket.historial.push({ fecha: ticket.fechaAsignacion!, usuario: 'Ing. Roberto Ramos Cárdenas', estadoAnterior: EstadoTicket.NUEVO, estadoNuevo: EstadoTicket.ASIGNADO, comentario: `Asignado a ${asignadoA.nombre}` });
  }
  if (c.estado === EstadoTicket.EN_PROCESO || c.estado === EstadoTicket.ESCALADO || cerradoOResuelto || c.estado === EstadoTicket.REABIERTO) {
    ticket.historial.push({ fecha: isoLima(creacionMs + 15 * 60_000), usuario: asignadoA?.nombre ?? 'Mesa de Ayuda', estadoAnterior: EstadoTicket.ASIGNADO, estadoNuevo: EstadoTicket.EN_PROCESO, comentario: 'Inicio de atención' });
  }
  if (c.estado === EstadoTicket.ESCALADO) {
    const motivo = 'Se requiere revisión especializada del switch del pabellón; no responde a reinicio remoto.';
    ticket.historial.push({ fecha: isoLima(creacionMs + 40 * 60_000), usuario: asignadoA?.nombre ?? 'Mesa de Ayuda', estadoAnterior: EstadoTicket.EN_PROCESO, estadoNuevo: EstadoTicket.ESCALADO, comentario: motivo });
    ticket.escalamientos.push({ fecha: isoLima(creacionMs + 40 * 60_000), nivelOrigen: NivelSoporte.N1, nivelDestino: NivelSoporte.N2, usuarioOrigen: asignadoA?.nombre ?? 'Mesa de Ayuda', usuarioDestino: null, motivo });
  }
  if (cerradoOResuelto || c.estado === EstadoTicket.REABIERTO) {
    const solucion = 'Se reemplazó el componente dañado y se verificó la operación con el usuario del área.';
    ticket.historial.push({ fecha: isoLima(resolucionRealMs!), usuario: asignadoA?.nombre ?? 'Ing. Carlos Mendoza', estadoAnterior: EstadoTicket.EN_PROCESO, estadoNuevo: EstadoTicket.RESUELTO, comentario: solucion });
    ticket.soluciones.push({ fecha: isoLima(resolucionRealMs!), usuario: asignadoA?.nombre ?? 'Ing. Carlos Mendoza', descripcion: solucion, esSolucionFinal: true });
  }
  if (c.estado === EstadoTicket.CERRADO) {
    ticket.historial.push({ fecha: ticket.fechaCierre!, usuario: solicitante.nombre, estadoAnterior: EstadoTicket.RESUELTO, estadoNuevo: EstadoTicket.CERRADO, comentario: 'Cierre con conformidad del usuario' });
  }
  if (c.estado === EstadoTicket.REABIERTO) {
    ticket.historial.push({ fecha: isoLima(AHORA - 30 * 60_000), usuario: solicitante.nombre, estadoAnterior: EstadoTicket.RESUELTO, estadoNuevo: EstadoTicket.REABIERTO, comentario: 'La falla volvió a presentarse después de la atención' });
    ticket.fechaResolucionReal = null;
  }
  return ticket;
}

const CONFIGS: ConfigTicket[] = [
  { titulo: 'Sin red en triaje de Emergencia', area: 1, categoria: 3, impacto: 'ALTO', urgencia: 'ALTA', estado: EstadoTicket.EN_PROCESO, haceMin: 100, solicitante: 5, asignado: 8 },
  { titulo: 'GALENHOS no carga módulo de Farmacia', area: 4, categoria: 2, impacto: 'ALTO', urgencia: 'ALTA', estado: EstadoTicket.NUEVO, haceMin: 10, solicitante: 10 },
  { titulo: 'Impresora SIS de Admisión trabada', area: 2, categoria: 5, impacto: 'MEDIO', urgencia: 'ALTA', estado: EstadoTicket.ASIGNADO, haceMin: 45, solicitante: 5, asignado: 9 },
  { titulo: 'PC de consultorio no enciende', area: 6, categoria: 1, impacto: 'BAJO', urgencia: 'MEDIA', estado: EstadoTicket.NUEVO, haceMin: 30, solicitante: 11 },
  { titulo: 'Usuario bloqueado en GALENHOS', area: 2, categoria: 4, impacto: 'MEDIO', urgencia: 'MEDIA', estado: EstadoTicket.EN_PROCESO, haceMin: 200, solicitante: 5, asignado: 8 },
  { titulo: 'Caída de enlace en Laboratorio', area: 5, categoria: 3, impacto: 'ALTO', urgencia: 'MEDIA', estado: EstadoTicket.ESCALADO, haceMin: 90, solicitante: 7, asignado: 8 },
  { titulo: 'Solicitud de laptop temporal para Triaje', tipo: 'SOLICITUD', area: 1, categoria: 1, impacto: 'MEDIO', urgencia: 'BAJA', estado: EstadoTicket.NUEVO, haceMin: 300, solicitante: 5 },
  { titulo: 'Lector de código de barras no lee DNI', area: 2, categoria: 1, impacto: 'BAJO', urgencia: 'ALTA', estado: EstadoTicket.ASIGNADO, haceMin: 150, solicitante: 6, asignado: 9 },
  { titulo: 'Error al emitir FUA SIS', area: 2, categoria: 2, impacto: 'ALTO', urgencia: 'ALTA', estado: EstadoTicket.ESCALADO, haceMin: 130, solicitante: 5, asignado: 2 },
  { titulo: 'Correo institucional no envía adjuntos', area: 6, categoria: 6, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.NUEVO, haceMin: 500, solicitante: 11, sinEquipo: true },
  { titulo: 'Monitor de UCI parpadea constantemente', area: 3, categoria: 1, impacto: 'ALTO', urgencia: 'ALTA', estado: EstadoTicket.EN_PROCESO, haceMin: 60, solicitante: 7, asignado: 2 },
  { titulo: 'Instalación de lector de firma digital', tipo: 'SOLICITUD', area: 6, categoria: 4, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.ASIGNADO, haceMin: 400, solicitante: 10, asignado: 9 },
  { titulo: 'Switch de Farmacia no responde', area: 4, categoria: 3, impacto: 'ALTO', urgencia: 'MEDIA', estado: EstadoTicket.ESCALADO, haceMin: 220, solicitante: 10, asignado: 8 },
  { titulo: 'Teclado de estación de Admisión dañado', area: 2, categoria: 1, impacto: 'BAJO', urgencia: 'MEDIA', estado: EstadoTicket.RESUELTO, haceMin: 600, solicitante: 5, asignado: 9 },
  { titulo: 'No imprime recetas en Consultorios', area: 6, categoria: 5, impacto: 'MEDIO', urgencia: 'MEDIA', estado: EstadoTicket.EN_PROCESO, haceMin: 180, solicitante: 11, asignado: 8 },
  { titulo: 'Acceso remoto para médico de guardia', tipo: 'SOLICITUD', area: 3, categoria: 4, impacto: 'MEDIO', urgencia: 'BAJA', estado: EstadoTicket.RESUELTO, haceMin: 900, solicitante: 7, asignado: 2 },
  { titulo: 'Pantalla azul en PC de Laboratorio', area: 5, categoria: 1, impacto: 'MEDIO', urgencia: 'ALTA', estado: EstadoTicket.REABIERTO, haceMin: 700, solicitante: 6, asignado: 8 },
  { titulo: 'Cambio de clave de usuario Windows', tipo: 'SOLICITUD', area: 4, categoria: 4, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.CERRADO, haceMin: 1500, solicitante: 10, asignado: 9 },
  { titulo: 'Wi-Fi de sala de espera sin acceso', area: 6, categoria: 3, impacto: 'BAJO', urgencia: 'MEDIA', estado: EstadoTicket.NUEVO, haceMin: 20, solicitante: 11, sinEquipo: true },
  { titulo: 'GALENHOS lento en hora punta de Admisión', area: 2, categoria: 2, impacto: 'ALTO', urgencia: 'MEDIA', estado: EstadoTicket.EN_PROCESO, haceMin: 210, solicitante: 5, asignado: 2 },
  { titulo: 'Impresora de Laboratorio sin tóner', area: 5, categoria: 5, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.CERRADO, haceMin: 2000, solicitante: 6, asignado: 9 },
  { titulo: 'Estación de UCI sin acceso a historia clínica', area: 3, categoria: 4, impacto: 'ALTO', urgencia: 'ALTA', estado: EstadoTicket.ASIGNADO, haceMin: 12, solicitante: 7, asignado: 2 },
  { titulo: 'Mouse de consultorio 4 no funciona', area: 6, categoria: 1, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.RESUELTO, haceMin: 800, solicitante: 11, asignado: 8 },
  { titulo: 'Actualización de Office en Admisión', tipo: 'SOLICITUD', area: 2, categoria: 6, impacto: 'BAJO', urgencia: 'BAJA', estado: EstadoTicket.CERRADO, haceMin: 2800, solicitante: 5, asignado: 9 },
  { titulo: 'Cable de red suelto en Farmacia', area: 4, categoria: 3, impacto: 'MEDIO', urgencia: 'MEDIA', estado: EstadoTicket.REABIERTO, haceMin: 500, solicitante: 10, asignado: 8 },
  { titulo: 'Token de firma digital no detectado', area: 1, categoria: 4, impacto: 'MEDIO', urgencia: 'ALTA', estado: EstadoTicket.NUEVO, haceMin: 8, solicitante: 5, sinEquipo: true },
];

export const TICKETS_MOCK: Ticket[] = CONFIGS.map((c, i) => construirTicket(i + 1, c));

export function resumenDe(t: Ticket): TicketResumen {
  return {
    id: t.id,
    codigo: t.codigo,
    tipo: t.tipo,
    titulo: t.titulo,
    prioridad: t.prioridad,
    estado: t.estado,
    estadoSla: t.estadoSla,
    nivelSoporte: t.nivelSoporte,
    area: t.area,
    solicitante: t.solicitante,
    asignadoA: t.asignadoA,
    fechaCreacion: t.fechaCreacion,
    fechaLimiteResolucion: t.fechaLimiteResolucion,
  };
}