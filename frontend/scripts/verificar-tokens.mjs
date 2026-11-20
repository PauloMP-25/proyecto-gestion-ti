#!/usr/bin/env node
/**
 * Guardián de Design Tokens.
 * Regla: ningún literal hexadecimal de color puede existir en src/**\/*.scss
 * ni en estilos inline de componentes, salvo en estilos/tokens/_primitivos.scss.
 *
 * Uso: node scripts/verificar-tokens.mjs [--informar]
 *   --informar  imprime el resumen pero no falla (útil durante la migración).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = new URL('../src/', import.meta.url).pathname;
const PERMITIDO = ['estilos', 'tokens', '_primitivos.scss'].join(sep);
const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const informar = process.argv.includes('--informar');

function* recorrer(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* recorrer(ruta);
    else if (/\.(scss|css)$/.test(nombre) || /\.component\.ts$/.test(nombre)) yield ruta;
  }
}

const hallazgos = new Map();
for (const archivo of recorrer(RAIZ)) {
  const rel = relative(RAIZ, archivo);
  if (rel === PERMITIDO) continue;
  const lineas = readFileSync(archivo, 'utf8').split('\n');
  lineas.forEach((linea, i) => {
    const sinComentario = linea.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '');
    // Evita falsos positivos de TS (p. ej. '#privado'): solo líneas con propiedades de estilo
    if (/\.ts$/.test(archivo) && !/(color|background|border|fill|stroke|shadow)/i.test(sinComentario)) return;
    const coincidencias = sinComentario.match(HEX);
    if (coincidencias) {
      if (!hallazgos.has(rel)) hallazgos.set(rel, []);
      hallazgos.get(rel).push(`  L${i + 1}: ${linea.trim()}`);
    }
  });
}

if (hallazgos.size === 0) {
  console.log('✔ Verificación de tokens: cero colores hexadecimales fuera de _primitivos.scss.');
  process.exit(0);
}

let total = 0;
for (const [archivo, lineas] of hallazgos) {
  total += lineas.length;
  console.log(`✘ ${archivo} (${lineas.length})`);
  if (!informar) lineas.forEach((l) => console.log(l));
}
console.log(`\n${total} literal(es) hex en ${hallazgos.size} archivo(s) fuera de _primitivos.scss.`);
process.exit(informar ? 0 : 1);
