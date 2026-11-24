import { Pipe, PipeTransform } from '@angular/core';
import { palabrasConsulta } from '../utilidades/busqueda-guias';

const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter] ?? caracter);
}

function normalizarConservandoLongitud(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Resalta las coincidencias del texto buscado escapando el HTML del contenido. */
@Pipe({ name: 'resaltar', standalone: true })
export class ResaltarPipe implements PipeTransform {
  transform(texto: string, termino: string): string {
    const original = texto ?? '';
    const palabras = palabrasConsulta(termino ?? '');
    if (palabras.length === 0 || !original) {
      return escaparHtml(original);
    }

    const normalizado = normalizarConservandoLongitud(original);
    const rangos: [number, number][] = [];
    for (const palabra of palabras) {
      let desde = 0;
      let indice = normalizado.indexOf(palabra, desde);
      while (indice !== -1) {
        rangos.push([indice, indice + palabra.length]);
        desde = indice + palabra.length;
        indice = normalizado.indexOf(palabra, desde);
      }
    }

    if (rangos.length === 0) {
      return escaparHtml(original);
    }

    rangos.sort((a, b) => a[0] - b[0]);
    const fusionados: [number, number][] = [];
    for (const rango of rangos) {
      const ultimo = fusionados[fusionados.length - 1];
      if (ultimo && rango[0] <= ultimo[1]) {
        ultimo[1] = Math.max(ultimo[1], rango[1]);
      } else {
        fusionados.push([rango[0], rango[1]]);
      }
    }

    let salida = '';
    let cursor = 0;
    for (const [inicio, fin] of fusionados) {
      salida += escaparHtml(original.slice(cursor, inicio));
      salida += `<mark>${escaparHtml(original.slice(inicio, fin))}</mark>`;
      cursor = fin;
    }
    salida += escaparHtml(original.slice(cursor));
    return salida;
  }
}
