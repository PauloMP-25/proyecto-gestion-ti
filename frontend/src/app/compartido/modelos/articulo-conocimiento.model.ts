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
