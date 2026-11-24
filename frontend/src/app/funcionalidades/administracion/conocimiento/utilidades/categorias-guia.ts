import {
  CategoriaGuia,
  DefinicionCategoriaGuia,
} from '../modelos/guias.model';

export const CATEGORIAS_GUIA: readonly DefinicionCategoriaGuia[] = [
  {
    clave: 'SISTEMA_CLINICO',
    id: 1,
    etiqueta: 'Sistema clínico (HIS)',
    descripcion: 'Historia clínica, admisión, citas, farmacia y laboratorio.',
    icono: 'clinical_notes',
    colorToken: '--color-categoria-1',
  },
  {
    clave: 'IMPRESORAS_TERMICAS',
    id: 2,
    etiqueta: 'Impresoras de etiquetas y térmicas',
    descripcion: 'Pulseras de pacientes, etiquetas de muestras y tickets de turno.',
    icono: 'print',
    colorToken: '--color-categoria-4',
  },
  {
    clave: 'REDES',
    id: 3,
    etiqueta: 'Redes y conectividad',
    descripcion: 'Cable de red, wifi, acceso a la red del hospital.',
    icono: 'lan',
    colorToken: '--color-categoria-2',
  },
  {
    clave: 'HARDWARE',
    id: 4,
    etiqueta: 'Hardware y periféricos',
    descripcion: 'Computadoras, monitores, lectores de código, teclados.',
    icono: 'devices',
    colorToken: '--color-categoria-3',
  },
  {
    clave: 'SOFTWARE_ASISTENCIAL',
    id: 5,
    etiqueta: 'Software asistencial',
    descripcion: 'Visores de imágenes, ofimática, correo y aplicaciones de apoyo.',
    icono: 'monitor_heart',
    colorToken: '--color-categoria-5',
  },
];

const CATEGORIA_POR_DEFECTO: DefinicionCategoriaGuia =
  CATEGORIAS_GUIA[CATEGORIAS_GUIA.length - 1];

export function categoriaPorId(id: number): DefinicionCategoriaGuia {
  return CATEGORIAS_GUIA.find((categoria) => categoria.id === id) ?? CATEGORIA_POR_DEFECTO;
}

export function categoriaPorClave(clave: CategoriaGuia): DefinicionCategoriaGuia {
  return CATEGORIAS_GUIA.find((categoria) => categoria.clave === clave) ?? CATEGORIA_POR_DEFECTO;
}
