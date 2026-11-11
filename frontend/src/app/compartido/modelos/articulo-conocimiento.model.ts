export interface ArticuloResumen {
  id: number;
  titulo: string;
  categoriaId: number;
  categoriaNombre: string;
  sintoma: string;
}

export interface ArticuloDetalle extends ArticuloResumen {
  causaRaiz: string | null;
  solucionTemporal: string;
  pasos: string[]; // derivados de SolucionWorkaround (una línea = un paso)
}
