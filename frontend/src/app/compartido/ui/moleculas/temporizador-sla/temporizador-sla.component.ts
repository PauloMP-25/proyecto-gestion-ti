import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlaInfo } from '../../../modelos/sla-info.model';
import { EstadoSLA } from '../../../modelos/estado-sla.enum';
import { RelojServidorService } from '../../../../nucleo/servicios/reloj-servidor.service';
import { TiempoRestantePipe } from '../../../tuberias/tiempo-restante.pipe';
import { SlaInsigniaComponent } from '../../atomos/sla-insignia/sla-insignia.component';

@Component({
  selector: 'app-temporizador-sla',
  standalone: true,
  imports: [CommonModule, SlaInsigniaComponent, TiempoRestantePipe],
  templateUrl: './temporizador-sla.component.html',
  styleUrl: './temporizador-sla.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporizadorSlaComponent {
  readonly relojServidor = inject(RelojServidorService);

  readonly sla = input.required<SlaInfo>();
  readonly mostrarBarra = input<boolean>(true);

  readonly estadoSevero = computed<EstadoSLA>(() => {

    const ahora = this.relojServidor.ahora();
    const vencimiento = new Date(this.sla().fechaVencimiento).getTime();
    const inicio = new Date(this.sla().fechaInicio).getTime();
    const backendEstado = this.sla().estado;

    // Si ya venció en tiempo real
    if (ahora >= vencimiento) {
      return EstadoSLA.INCUMPLIDO;
    }

    // Calcular % consumido
    const duracionTotal = vencimiento - inicio;
    if (duracionTotal > 0) {
      const tiempoConsumido = ahora - inicio;
      const porcentaje = (tiempoConsumido / duracionTotal) * 100;
      if (porcentaje >= 80) {
        // Puede empeorar de A_TIEMPO a ALERTA
        return backendEstado === EstadoSLA.INCUMPLIDO ? EstadoSLA.INCUMPLIDO : EstadoSLA.ALERTA;
      }
    }

    return backendEstado;
  });

  readonly porcentajeConsumido = computed<number>(() => {
    const ahora = this.relojServidor.ahora();
    const vencimiento = new Date(this.sla().fechaVencimiento).getTime();
    const inicio = new Date(this.sla().fechaInicio).getTime();
    const duracionTotal = vencimiento - inicio;

    if (duracionTotal <= 0) return 100;

    const tiempoConsumido = ahora - inicio;
    const pct = Math.min(Math.max((tiempoConsumido / duracionTotal) * 100, 0), 100);
    return Math.round(pct);
  });
}
