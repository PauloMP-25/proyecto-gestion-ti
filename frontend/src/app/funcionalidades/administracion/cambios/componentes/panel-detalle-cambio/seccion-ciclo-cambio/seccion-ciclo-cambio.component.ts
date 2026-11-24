import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconoComponent } from '../../../../../../compartido/ui/atomos/icono/icono.component';
import { AlertaEnLineaComponent } from '../../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { EstadoCambio } from '../../../modelos/cambios.model';

interface EtapaCiclo {
  readonly estado: Exclude<EstadoCambio, 'RECHAZADO'>;
  readonly texto: string;
}

const ETAPAS: readonly EtapaCiclo[] = [
  { estado: 'BORRADOR', texto: 'Borrador' },
  { estado: 'EN_EVALUACION', texto: 'En evaluación' },
  { estado: 'APROBADO', texto: 'Aprobado' },
  { estado: 'EN_EJECUCION', texto: 'En ejecución' },
  { estado: 'IMPLEMENTADO', texto: 'Implementado' },
];

@Component({
  selector: 'app-seccion-ciclo-cambio',
  standalone: true,
  imports: [IconoComponent, AlertaEnLineaComponent],
  templateUrl: './seccion-ciclo-cambio.component.html',
  styleUrl: './seccion-ciclo-cambio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCicloCambioComponent {
  readonly estado = input.required<EstadoCambio>();
  readonly motivo = input<string | null>(null);

  protected readonly ETAPAS = ETAPAS;

  protected readonly esRechazado = computed(() => this.estado() === 'RECHAZADO');

  protected readonly indiceActual = computed(() => {
    if (this.esRechazado()) {
      return 1;
    }
    const indice = ETAPAS.findIndex((etapa) => etapa.estado === this.estado());
    return indice < 0 ? 0 : indice;
  });

  protected esCompletada(indice: number): boolean {
    return indice < this.indiceActual();
  }

  protected esActual(indice: number): boolean {
    return indice === this.indiceActual() && !this.esRechazado();
  }

  protected esEtapaRechazada(indice: number): boolean {
    return indice === this.indiceActual() && this.esRechazado();
  }
}
