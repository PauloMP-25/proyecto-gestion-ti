/**
 * Lee el valor RESUELTO de un token CSS (p. ej. '--comp-grafico-eje-x-texto').
 *
 * Necesario para librerías que dibujan en <canvas> (Chart.js), donde no se
 * puede usar var(--token). Así los colores siguen viniendo del Design System
 * (y respetan el tema claro/noche vigente al momento de construir el gráfico).
 */
export function leerToken(nombre: string, respaldo = ''): string {
  if (typeof document === 'undefined') return respaldo;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return valor || respaldo;
}

/** Lee varios tokens numerados: leerTokens('--comp-grafico-barras', 10) → [-1 … -10]. */
export function leerTokensNumerados(prefijo: string, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => leerToken(`${prefijo}-${i + 1}`));
}
