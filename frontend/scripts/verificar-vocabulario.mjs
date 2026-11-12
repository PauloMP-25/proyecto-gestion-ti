import { readFileSync, globSync } from 'node:fs';

const PROHIBIDO_GLOBAL = [/\bITIL(\s?v?4)?\b/i];
const archivos = globSync('src/**/*.{html,ts}', {
  exclude: (f) => /\.spec\.ts$|vocabulario-asistencial\.ts$/.test(f),
});

let errores = 0;
for (const f of archivos) {
  const txt = readFileSync(f, 'utf8');
  // Ignora comentarios y nombres de clase CSS; busca en literales visibles
  const sinComentarios = txt.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  const sinClases = sinComentarios.replace(/class=["'][^"']*["']/g, '');
  for (const r of PROHIBIDO_GLOBAL) {
    if (r.test(sinClases)) {
      console.error(`✖ ${f}: término prohibido ${r}`);
      errores++;
    }
  }
}

if (errores === 0) {
  console.log('✔ Verificación de vocabulario: Cero referencias a ITIL en código fuente visible.');
}

process.exit(errores ? 1 : 0);
