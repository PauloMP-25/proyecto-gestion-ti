import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoSLA, EstadoSLAEtiquetas } from '../../../modelos/estado-sla.enum';
import { IconoComponent } from '../icono/icono.component';
import { TiempoRestantePipe } from '../../../tuberias/tiempo-restante.pipe';
import { RelojServidorService } from '../../../../nucleo/servicios/reloj-servidor.service';

@Component({
  selector: 'app-sla-insignia',
  standalone: true,
  imports: [CommonModule, IconoComponent, TiempoRestantePipe],
  templateUrl: './sla-insignia.component.html',
  styleUrl: './sla-insignia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlaInsigniaComponent {
  private reloj = inject(RelojServidorService);

  readonly estado = input.required<EstadoSLA | keyof typeof EstadoSLA | string>();
  readonly limite = input<string | null>(null);
  readonly texto = input<string | undefined>(undefined);
  readonly mostrarIcono = input<boolean>(true);

  readonly ahora = this.reloj.ahora;

  readonly config = computed(() => {
    switch (this.estado()) {
      case EstadoSLA.A_TIEMPO:
      case 'A_TIEMPO':
        return {
          clase: 'sla--a-tiempo',
          icono: 'schedule',
          textoDefault: EstadoSLAEtiquetas[EstadoSLA.A_TIEMPO],
        };
      case EstadoSLA.ALERTA:
      case 'ALERTA':
        return {
          clase: 'sla--alerta',
          icono: 'warning',
          textoDefault: EstadoSLAEtiquetas[EstadoSLA.ALERTA],
        };
      case EstadoSLA.INCUMPLIDO:
      case 'INCUMPLIDO':
      default:
        return {
          clase: 'sla--incumplido',
          icono: 'error',
          textoDefault: EstadoSLAEtiquetas[EstadoSLA.INCUMPLIDO],
        };
    }
  });
}
