import { FiltroGuias, GuiaVista } from '../modelos/guias.model';

export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function palabrasConsulta(texto: string): string[] {
  return normalizarTexto(texto)
    .split(/\s+/)
    .filter((palabra) => palabra.length >= 2);
}

function incluyeCampo(campo: string, palabra: string): boolean {
  return normalizarTexto(campo).includes(palabra);
}

function puntuar(guia: GuiaVista, palabras: readonly string[]): number {
  if (palabras.length === 0) {
    return 0;
  }

  const campos: readonly { readonly textos: readonly string[]; readonly peso: number }[] = [
    { textos: [guia.titulo], peso: 5 },
    { textos: [guia.sintoma ?? ''], peso: 4 },
    { textos: guia.palabrasClave ?? [], peso: 3 },
    { textos: guia.equiposCompatibles ?? [], peso: 2 },
    { textos: [guia.resumen], peso: 1 },
  ];

  let puntaje = 0;
  for (const palabra of palabras) {
    const coincide = campos.some((campo) =>
      campo.textos.some((texto) => incluyeCampo(texto, palabra)),
    );
    if (!coincide) {
      return 0;
    }
    puntaje += campos.reduce(
      (total, campo) =>
        total +
        (campo.textos.some((texto) => incluyeCampo(texto, palabra)) ? campo.peso : 0),
      0,
    );
  }
  return puntaje;
}

export function filtrarYOrdenar(
  guias: readonly GuiaVista[],
  filtro: FiltroGuias,
): GuiaVista[] {
  const palabras = palabrasConsulta(filtro.texto);

  const filtradas = guias.filter((guia) => {
    if (filtro.categoria && guia.categoria.clave !== filtro.categoria) {
      return false;
    }
    if (filtro.ambito === 'PUBLICO' && !guia.esPublico) {
      return false;
    }
    if (filtro.ambito === 'INTERNO' && guia.esPublico) {
      return false;
    }
    if (palabras.length > 0 && puntuar(guia, palabras) === 0) {
      return false;
    }
    return true;
  });

  if (palabras.length === 0) {
    return [...filtradas].sort((a, b) => b.conteoUtil - a.conteoUtil);
  }

  return [...filtradas].sort((a, b) => {
    const diferencia = puntuar(b, palabras) - puntuar(a, palabras);
    return diferencia !== 0 ? diferencia : b.conteoUtil - a.conteoUtil;
  });
}

/** Conteo por categoría respetando texto y ámbito, sin aplicar el filtro de categoría. */
export function contarPorCategoria(
  guias: readonly GuiaVista[],
  filtro: FiltroGuias,
): Record<string, number> {
  const sinCategoria: FiltroGuias = { ...filtro, categoria: null };
  const resultado: Record<string, number> = {};
  for (const guia of filtrarYOrdenar(guias, sinCategoria)) {
    resultado[guia.categoria.clave] = (resultado[guia.categoria.clave] ?? 0) + 1;
  }
  return resultado;
}
