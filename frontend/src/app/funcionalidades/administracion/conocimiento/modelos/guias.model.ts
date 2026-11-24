import { ArticuloConocimiento } from '../../../../compartido/modelos/articulo-conocimiento.model';

/** Las 5 categorías oficiales del Centro de Soluciones. */
export type CategoriaGuia =
  | 'SISTEMA_CLINICO'
  | 'IMPRESORAS_TERMICAS'
  | 'REDES'
  | 'HARDWARE'
  | 'SOFTWARE_ASISTENCIAL';

export interface DefinicionCategoriaGuia {
  readonly clave: CategoriaGuia;
  readonly id: number;
  readonly etiqueta: string;
  readonly descripcion: string;
  readonly icono: string;
  readonly colorToken: string;
}

export type AmbitoGuia = 'TODOS' | 'PUBLICO' | 'INTERNO';

export interface FiltroGuias {
  texto: string;
  categoria: CategoriaGuia | null;
  ambito: AmbitoGuia;
}

export const FILTRO_GUIAS_INICIAL: FiltroGuias = {
  texto: '',
  categoria: null,
  ambito: 'TODOS',
};

/** Guía enriquecida para la vista (añade la categoría resuelta). */
export interface GuiaVista extends ArticuloConocimiento {
  readonly categoria: DefinicionCategoriaGuia;
}
