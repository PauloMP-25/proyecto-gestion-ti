import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TonoInsignia } from '../insignia/insignia.component';

export interface SegmentoProgreso {
  valor: number;
  tono: TonoInsignia;
  etiqueta: string;
}

@Component({
  selector: 'app-barra-progreso',
  standalone: true,
  templateUrl: './barra-progreso.component.html',
  styleUrl: './barra-progreso.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraProgresoComponent {
  readonly segmentos = input.required<readonly SegmentoProgreso[]>();
  readonly total = input.required<number>();
  readonly etiquetaAccesible = input.required<string>();
  readonly mostrarPorcentaje = input<boolean>(false);

  // Valor total acumulado de los segmentos
  readonly valorAcumulado = computed(() => {
    return this.segmentos().reduce((acc, seg) => acc + (seg.valor || 0), 0);
  });

  // Porcentaje total ocupado
  readonly porcentajeTotal = computed(() => {
    const tot = this.total();
    if (tot <= 0) return 0;
    const pct = (this.valorAcumulado() / tot) * 100;
    return Math.min(Math.round(pct), 100);
  });

  // Segmentos normalizados a porcentajes de ancho
  readonly segmentosNormalizados = computed(() => {
    const tot = this.total();
    if (tot <= 0) return [];
    return this.segmentos().map(seg => ({
      ...seg,
      porcentaje: Math.min(((seg.valor || 0) / tot) * 100, 100),
    }));
  });
}
