import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  BarraProgresoComponent,
  SegmentoProgreso,
} from '../../../../../../../compartido/ui/atomos/barra-progreso/barra-progreso.component';

@Component({
  selector: 'app-seccion-pasos-solucion',
  standalone: true,
  imports: [BarraProgresoComponent],
  templateUrl: './seccion-pasos-solucion.component.html',
  styleUrl: './seccion-pasos-solucion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionPasosSolucionComponent {
  readonly pasos = input.required<readonly string[]>();

  private readonly _hechos = signal<ReadonlySet<number>>(new Set());

  protected readonly total = computed(() => this.pasos().length);
  protected readonly completados = computed(() => this._hechos().size);
  protected readonly etiquetaProgreso = computed(
    () => `${this.completados()} de ${this.total()} pasos completados`,
  );
  protected readonly segmentos = computed<readonly SegmentoProgreso[]>(() => [
    { valor: this.completados(), tono: 'exito', etiqueta: 'Pasos completados' },
  ]);

  protected estaHecho(indice: number): boolean {
    return this._hechos().has(indice);
  }

  protected alternar(indice: number, evento: Event): void {
    const marcado = (evento.target as HTMLInputElement).checked;
    this._hechos.update((actuales) => {
      const siguientes = new Set(actuales);
      if (marcado) {
        siguientes.add(indice);
      } else {
        siguientes.delete(indice);
      }
      return siguientes;
    });
  }
}
