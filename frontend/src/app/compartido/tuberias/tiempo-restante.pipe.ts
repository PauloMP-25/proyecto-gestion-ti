import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tiempoRestante',
  standalone: true,
  pure: false, // Permite reevaluar cuando el reloj reactivo cambie
})
export class TiempoRestantePipe implements PipeTransform {
  transform(fechaVencimientoIso: string, ahoraMs: number = Date.now()): string {
    if (!fechaVencimientoIso) return '--';

    const vencimiento = new Date(fechaVencimientoIso).getTime();
    if (isNaN(vencimiento)) return '--';

    const diffMs = vencimiento - ahoraMs;

    if (diffMs <= 0) {
      const transcurridoMs = Math.abs(diffMs);
      const minutosVencidos = Math.floor(transcurridoMs / (1000 * 60));
      if (minutosVencidos < 60) {
        return `Vencido hace ${minutosVencidos}m`;
      }
      const horasVencidas = Math.floor(minutosVencidos / 60);
      const minsResto = minutosVencidos % 60;
      return `Vencido hace ${horasVencidas}h ${minsResto}m`;
    }

    const totalSegundos = Math.floor(diffMs / 1000);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }

    const segundos = totalSegundos % 60;
    if (minutos > 0) {
      return `${minutos}m ${segundos}s`;
    }

    return `${segundos}s`;
  }
}
