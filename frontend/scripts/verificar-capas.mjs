import { readFileSync, globSync } from 'node:fs';

/**
 * Script de validación de arquitectura de capas frontend para la Mesa de Ayuda HSMSI.
 * Reglas:
 * 1. *.page.ts y componentes/ no pueden importar HttpClient, *.http ni *.mock.
 * 2. Ningún archivo fuera de *.providers.ts o *.spec.ts puede importar *.http ni *.mock.
 * 3. Ningún archivo fuera de *.http.ts, *.dto.ts o *.mapper.ts puede importar *.dto.
 */
const archivos = globSync(
  ['src/app/funcionalidades/administracion/**/*.{html,ts}', 'src/app/compartido/catalogos/**/*.{html,ts}'],
  {
    exclude: (f) => /\.spec\.ts$/.test(f),
  }
);

let errores = 0;

for (const f of archivos) {
  const contenido = readFileSync(f, 'utf8');
  const esPage = /\.page\.ts$/.test(f);
  const esComponente = f.includes('/componentes/') || /\.component\.ts$/.test(f);
  const esProvider = /\.providers\.ts$/.test(f);
  const esHttp = /\.http\.ts$/.test(f);
  const esMapper = /\.mapper\.ts$/.test(f);
  const esDto = /\.dto\.ts$/.test(f);

  // Regla 1: páginas y componentes no importan HttpClient, *.http ni *.mock
  if (esPage || esComponente) {
    if (/from\s+['"][^'"]*(\.http|\.mock)['"]/.test(contenido)) {
      console.error(`✖ ${f}: Páginas y componentes no deben importar *.http ni *.mock directamente (use la Api abstracta o Store).`);
      errores++;
    }
    if (/from\s+['"]@angular\/common\/http['"]/.test(contenido) && /HttpClient\b/.test(contenido)) {
      console.error(`✖ ${f}: Páginas y componentes no deben importar HttpClient directamente.`);
      errores++;
    }
  }

  // Regla 2: *.http y *.mock solo pueden ser importados en *.providers.ts
  if (!esProvider && !esHttp) {
    if (/from\s+['"][^'"]*(\.http|\.mock)['"]/.test(contenido)) {
      console.error(`✖ ${f}: Implementaciones *.http o *.mock solo deben importarse en *.providers.ts.`);
      errores++;
    }
  }

  // Regla 3: *.dto solo en *.http, *.mapper y *.dto
  if (!esHttp && !esMapper && !esDto) {
    if (/from\s+['"][^'"]*\.dto['"]/.test(contenido)) {
      console.error(`✖ ${f}: Contratos *.dto solo deben importarse en *.http.ts o *.mapper.ts.`);
      errores++;
    }
  }
}

if (errores === 0) {
  console.log('✔ Verificación de capas frontend: Arquitectura desacoplada limpia (DIP respetado).');
} else {
  console.error(`\nTotal de infracciones de capas: ${errores}`);
}

process.exit(errores ? 1 : 0);
