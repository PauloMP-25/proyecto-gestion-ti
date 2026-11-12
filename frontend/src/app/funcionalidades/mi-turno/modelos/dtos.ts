export interface TicketTurnoDto {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  nivelSoporte: string;
  categoriaId: number;
  categoriaNombre: string;
  areaNombre: string;
  solicitanteNombre: string;
  anexo?: string | null;
  equipo?: {
    id: number;
    hostname: string;
    ip: string;
    areaId: number;
    area: string;
    tipo: string;
  } | null;
  asignadoA?: {
    id: number;
    nombre: string;
  } | null;
  esMio: boolean;
  reabierto: boolean;
  fechaCreacionIso: string;
  slaVista: {
    inicioIso: string;
    limiteRespuestaIso: string;
    limiteResolucionIso: string;
    fase: 'RESPUESTA' | 'RESOLUCION' | 'COMPLETADO';
  };
  ahoraServidorIso?: string;
}

export interface ResumenTurnoDto {
  asignados: number;
  porVencer: number;
  vencidos: number;
  resueltosHoy: number;
  hayP1SinTomar: boolean;
  ahoraServidorIso: string;
}

export interface TomarTicketPayloadDto {
  iniciarAtencion: boolean;
}

export interface ResolverTicketPayloadDto {
  diagnostico: string;
  accionRealizada: string;
  insumosUtilizados?: string;
  tipoSolucion: 'DEFINITIVA' | 'TEMPORAL';
  articuloConocimientoId?: number | null;
}

export interface EscalarTicketPayloadDto {
  motivo: string;
}
