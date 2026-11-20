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
