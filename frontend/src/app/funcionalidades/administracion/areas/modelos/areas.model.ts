export interface PersonaResumenArea {
  readonly id: number;
  readonly nombreVisible: string;
}

export interface AreaResumen {
  readonly id: number;
  readonly nombre: string;
  readonly piso: number | null;
  readonly ubicacionLegible: string;
  readonly anexo: string | null;
  readonly encargado: PersonaResumenArea | null;
  readonly activo: boolean;
  readonly totalPersonal: number;
  readonly totalComputadoras: number;
  readonly totalImpresoras: number;
  readonly prioridadDefecto?: string | null;
}

export interface AreaDetalle extends AreaResumen {
  readonly referenciaUbicacion: string | null;
}

export interface AreaFormulario {
  readonly nombre: string;
  readonly piso: number | null;
  readonly referenciaUbicacion: string | null;
  readonly anexo: string | null;
  readonly idEncargado: number | null;
  readonly prioridadDefecto?: string | null;
}

export interface FiltroAreas {
  readonly buscar?: string;
  readonly incluirInactivas?: boolean;
}

export interface PisoOpcion {
  readonly valor: number | null;
  readonly etiqueta: string;
}

export const PISOS_HOSPITALARIOS: readonly PisoOpcion[] = [
  { valor: null, etiqueta: 'No especificar' },
  { valor: 0, etiqueta: 'Sótano' },
  { valor: 1, etiqueta: 'Primer Piso' },
  { valor: 2, etiqueta: 'Segundo Piso' },
  { valor: 3, etiqueta: 'Tercer Piso' },
  { valor: 4, etiqueta: 'Cuarto Piso' },
  { valor: 5, etiqueta: 'Quinto Piso' },
  { valor: 6, etiqueta: 'Sexto Piso' },
  { valor: 7, etiqueta: 'Séptimo Piso' },
  { valor: 8, etiqueta: 'Octavo Piso' },
  { valor: 9, etiqueta: 'Noveno Piso' },
  { valor: 10, etiqueta: 'Décimo Piso' },
];

export interface PrioridadOpcion {
  readonly valor: string;
  readonly etiqueta: string;
  readonly descripcion: string;
}

export const PRIORIDADES_AREA: readonly PrioridadOpcion[] = [
  { valor: 'P1', etiqueta: 'P1 · Crítica', descripcion: 'Soporte vital inmediato (Shock Trauma, UCI)' },
  { valor: 'P2', etiqueta: 'P2 · Alta', descripcion: 'Servicio clínico prioritario (Emergencia, Farmacia, Triaje)' },
  { valor: 'P3', etiqueta: 'P3 · Media', descripcion: 'Atención general (Consultorios, Enfermería)' },
  { valor: 'P4', etiqueta: 'P4 · Baja', descripcion: 'Áreas administrativas y no asistenciales' },
];
