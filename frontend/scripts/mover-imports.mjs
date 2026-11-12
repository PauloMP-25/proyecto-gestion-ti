import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { relative, dirname, resolve } from 'node:path';

const [,, rutaVieja, rutaNueva] = process.argv;

if (!rutaVieja || !rutaNueva) {
  console.error('Uso: node scripts/mover-imports.mjs <rutaViejaRelativaSrc> <rutaNuevaRelativaSrc>');
  console.error('Ejemplo: node scripts/mover-imports.mjs compartido/componentes/sla-cronometro compartido/ui/organismos/sla-cronometro');
  process.exit(1);
}

const archivos = globSync('src/**/*.ts');
let modificados = 0;

for (const archivo of archivos) {
  let contenido = readFileSync(archivo, 'utf8');
  if (contenido.includes(rutaVieja)) {
    const reemplazado = contenido.replaceAll(rutaVieja, rutaNueva);
    writeFileSync(archivo, reemplazado, 'utf8');
    modificados++;
  }
}

console.log(`✔ Codemod de imports: ${modificados} archivos actualizados de "${rutaVieja}" a "${rutaNueva}".`);
