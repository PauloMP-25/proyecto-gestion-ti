import { TiempoRestantePipe } from './tiempo-restante.pipe';

describe('TiempoRestantePipe', () => {
  const pipe = new TiempoRestantePipe();
  const ahora = new Date('2026-11-10T12:00:00-05:00').getTime();

  it('muestra horas y minutos cuando falta más de una hora', () => {
    const limite = new Date(ahora + (2 * 60 + 15) * 60_000).toISOString();
    expect(pipe.transform(limite, ahora)).toBe('2h 15m');
  });

  it('muestra minutos y segundos cuando falta menos de una hora', () => {
    const limite = new Date(ahora + 5 * 60_000 + 30_000).toISOString();
    expect(pipe.transform(limite, ahora)).toBe('5m 30s');
  });

  it('muestra solo segundos cuando falta menos de un minuto', () => {
    const limite = new Date(ahora + 45_000).toISOString();
    expect(pipe.transform(limite, ahora)).toBe('45s');
  });

  it('muestra "vencido hace Xm" con menos de una hora vencida', () => {
    const limite = new Date(ahora - 30 * 60_000).toISOString();
    expect(pipe.transform(limite, ahora)).toBe('vencido hace 30m');
  });

  it('muestra "vencido hace Xh Ym" con más de una hora vencida', () => {
    const limite = new Date(ahora - (2 * 60 + 5) * 60_000).toISOString();
    expect(pipe.transform(limite, ahora)).toBe('vencido hace 2h 5m');
  });

  it('devuelve "--" ante fecha vacía o inválida', () => {
    expect(pipe.transform('', ahora)).toBe('--');
    expect(pipe.transform('no-es-fecha', ahora)).toBe('--');
  });
});