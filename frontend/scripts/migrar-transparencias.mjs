#!/usr/bin/env node
/**
 * Migración única: reemplaza rgb(R G B / N%) por tokens semánticos de transparencia
 * y genera las definiciones (primitivo N1 + semántico N2).
 *   node scripts/migrar-transparencias.mjs [--aplicar]
 * Sin --aplicar solo informa.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = new URL('../src/', import.meta.url).pathname;
const TOKENS = join(RAIZ, 'estilos', 'tokens') + sep;
const aplicar = process.argv.includes('--aplicar');

// triple RGB → [nombre primitivo, nombre semántico]
const FAMILIAS = {
  '112 28 28': ['guinda', 'primary'],
  '0 0 0': ['negro', 'negro'],
  '255 255 255': ['blanco', 'blanco'],
  '15 23 42': ['slate', 'tinta'],
  '220 38 38': ['rojo', 'peligro'],
  '22 163 74': ['verde-vivo', 'exito-vivo'],
  '27 94 32': ['verde', 'secondary'],
  '11 28 48': ['tinta-azul', 'tinta-azul'],
  '226 232 240': ['slate-200', 'neutro-200'],
  '241 245 249': ['slate-100', 'neutro-100'],
};
const RGB = /rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*(?:[/,]\s*([\d.]+)(%?))?\s*\)/g;

function* recorrer(dir) {
  for (const n of readdirSync(dir)) {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) yield* recorrer(r);
    else if (/\.(scss|css)$/.test(n) || /\.component\.ts$/.test(n)) yield r;
  }
}

const usados = new Map(); // clave → {prim, sem, valor}
const desconocidos = new Set();
let reemplazos = 0;

for (const archivo of recorrer(RAIZ)) {
  if (archivo.startsWith(TOKENS)) continue;
  const original = readFileSync(archivo, 'utf8');
  const nuevo = original.replace(RGB, (m, r, g, b, a, pct) => {
    const triple = `${r} ${g} ${b}`;
    const fam = FAMILIAS[triple];
    if (!fam) { desconocidos.add(`${relative(RAIZ, archivo)}: ${m}`); return m; }
    let alfa = a === undefined ? 100 : Number(a);
    if (a !== undefined && !pct) alfa = Math.round(alfa * 100);
    const [prim, sem] = fam;
    const clave = `${prim}-${alfa}`;
    usados.set(clave, {
      prim: `--prim-alfa-${prim}-${alfa}`,
      sem: `--color-${sem}-alfa-${alfa}`,
      valor: `rgb(${triple} / ${alfa}%)`,
    });
    reemplazos++;
    return `var(--color-${sem}-alfa-${alfa})`;
  });
  if (nuevo !== original && aplicar) writeFileSync(archivo, nuevo);
}

console.log(`${reemplazos} reemplazo(s), ${usados.size} token(s) de transparencia.`);
if (desconocidos.size) { console.log('SIN MAPEO:'); desconocidos.forEach((d) => console.log('  ' + d)); }

if (aplicar) {
  const prim = join(TOKENS, '_primitivos.scss');
  const txtPrim = readFileSync(prim, 'utf8');
  const nuevasPrim = [...usados.values()]
    .filter((u) => !txtPrim.includes(`${u.prim}:`))
    .sort((a, b) => a.prim.localeCompare(b.prim))
    .map((u) => `  ${u.prim}: ${u.valor};`);
  const bloque = `\n  /* ── Transparencias generadas (familia + porcentaje) ───── */\n${nuevasPrim.join('\n')}\n}\n`;
  writeFileSync(prim, txtPrim.replace(/\}\s*$/, bloque));

  const sem = [...usados.values()]
    .sort((a, b) => a.sem.localeCompare(b.sem))
    .map((u) => `  ${u.sem}: var(${u.prim});`)
    .join('\n');
  writeFileSync(
    join(TOKENS, '_transparencias.scss'),
    `/* NIVEL 2 — Transparencias semánticas (sombras, halos de foco, velos, hover suave).\n * Convención: --color-{familia}-alfa-{porcentaje}\n */\n:root {\n${sem}\n}\n`,
  );
  console.log('Definiciones escritas en _primitivos.scss y _transparencias.scss');
}
