export type NivelDificultad = 'BASICO' | 'INTERMEDIO' | 'AVANZADO';

export interface ArticuloConocimiento {
  id: number;
  titulo: string;
  resumen: string;
  contenidoHtml: string;
  categoriaId: number;
  categoriaNombre: string;
  palabrasClave: string[];
  equiposCompatibles: string[];
  esPublico: boolean;
  conteoUtil: number;
  fechaActualizacion: string;
  sintoma?: string;
  causaRaiz?: string | null;
  solucionTemporal?: string;
  pasos?: string[];
  precauciones?: string[];
  nivelDificultad?: NivelDificultad;
  minutosEstimados?: number;
  requiereTecnico?: boolean;
  autorNombre?: string;
}

export interface ArticuloResumen {
  id: number;
  titulo: string;
  categoriaId: number;
  categoriaNombre: string;
  sintoma: string;
  resumen?: string;
  conteoUtil?: number;
  fechaActualizacion?: string;
}

export interface ArticuloDetalle extends ArticuloResumen {
  causaRaiz: string | null;
  solucionTemporal: string;
  pasos: string[];
  contenidoHtml?: string;
  palabrasClave?: string[];
  equiposCompatibles?: string[];
  esPublico?: boolean;
}

export {
  mapearArticuloResumen,
  mapearArticuloDetalle,
  mapearArticuloConocimiento,
} from './articulo-conocimiento.mapper';

