import { ArticuloConocimiento } from '../../../../compartido/modelos/articulo-conocimiento.model';
import {
  CATEGORIAS_GUIA,
  categoriaPorId,
} from './categorias-guia';
import { contarPorCategoria, filtrarYOrdenar } from './busqueda-guias';
import { FiltroGuias, GuiaVista } from '../modelos/guias.model';

function guia(
  id: number,
  titulo: string,
  categoriaId: number,
  extra: Partial<ArticuloConocimiento> = {},
): GuiaVista {
  return {
    id,
    titulo,
    resumen: 'Resumen de prueba',
    contenidoHtml: '',
    categoriaId,
    categoriaNombre: categoriaPorId(categoriaId).etiqueta,
    palabrasClave: [],
    equiposCompatibles: [],
    esPublico: true,
    conteoUtil: 0,
    fechaActualizacion: '2026-11-20T09:00:00Z',
    categoria: categoriaPorId(categoriaId),
    ...extra,
  };
}

const GUÍAS: readonly GuiaVista[] = [
  guia(1, 'Calibración y desatasco de impresora de pulseras de triaje', 2, {
    sintoma: 'Luz roja parpadeante o papel atascado',
    palabrasClave: ['impresora', 'pulsera', 'zebra', 'termica'],
    equiposCompatibles: ['Zebra ZD220'],
    conteoUtil: 42,
  }),
  guia(2, 'Etiquetas de tubos de laboratorio impresas cortadas', 2, {
    sintoma: 'El código de barras sale cortado',
    palabrasClave: ['etiqueta', 'laboratorio', 'zebra'],
    equiposCompatibles: ['Zebra GK420t'],
    conteoUtil: 27,
  }),
  guia(3, 'El sistema clínico muestra sesión expirada en admisión', 1, {
    sintoma: 'Sesión expirada al registrar una admisión',
    palabrasClave: ['admisión', 'sesión', 'sistema clínico'],
    conteoUtil: 31,
  }),
  guia(4, 'Restablecer la conexión de red cableada en consultorios', 3, {
    sintoma: 'Sin acceso a la red del hospital',
    palabrasClave: ['red', 'cable', 'consultorio'],
    esPublico: false,
    conteoUtil: 10,
  }),
];

const FILTRO_VACIO: FiltroGuias = { texto: '', categoria: null, ambito: 'TODOS' };

describe('busqueda-guias', () => {
  it('encuentra las guías de impresora por relevancia', () => {
    const resultado = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, texto: 'impresora' });

    expect(resultado.length).toBe(1);
    expect(resultado[0].id).toBe(1);
  });

  it('trata igual el texto con tilde y sin tilde', () => {
    const conTilde = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, texto: 'admisión' });
    const sinTilde = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, texto: 'admision' });

    expect(conTilde.map((item) => item.id)).toEqual([3]);
    expect(sinTilde.map((item) => item.id)).toEqual([3]);
  });

  it('exige que todas las palabras de la consulta coincidan', () => {
    const ambas = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, texto: 'zebra pulsera' });
    const inexistente = filtrarYOrdenar(GUÍAS, {
      ...FILTRO_VACIO,
      texto: 'zebra monitor',
    });

    expect(ambas.map((item) => item.id)).toEqual([1]);
    expect(inexistente).toEqual([]);
  });

  it('devuelve todo ordenado por utilidad cuando no hay texto', () => {
    const resultado = filtrarYOrdenar(GUÍAS, FILTRO_VACIO);

    expect(resultado.map((item) => item.id)).toEqual([1, 3, 2, 4]);
  });

  it('filtra por categoría y por ámbito', () => {
    const impresoras = filtrarYOrdenar(GUÍAS, {
      ...FILTRO_VACIO,
      categoria: 'IMPRESORAS_TERMICAS',
    });
    const internas = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, ambito: 'INTERNO' });
    const publicas = filtrarYOrdenar(GUÍAS, { ...FILTRO_VACIO, ambito: 'PUBLICO' });

    expect(impresoras.map((item) => item.id)).toEqual([1, 2]);
    expect(internas.map((item) => item.id)).toEqual([4]);
    expect(publicas.map((item) => item.id)).toEqual([1, 3, 2]);
  });

  it('cuenta por categoría sin aplicar el filtro de categoría', () => {
    const conteo = contarPorCategoria(GUÍAS, FILTRO_VACIO);

    expect(conteo['IMPRESORAS_TERMICAS']).toBe(2);
    expect(conteo['SISTEMA_CLINICO']).toBe(1);
    expect(conteo['REDES']).toBe(1);
    expect(conteo['HARDWARE']).toBeUndefined();
    expect(CATEGORIAS_GUIA).toHaveLength(5);
  });
});
