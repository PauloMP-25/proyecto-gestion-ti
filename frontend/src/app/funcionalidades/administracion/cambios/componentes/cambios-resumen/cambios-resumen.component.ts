import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ChipFiltroComponent } from '../../../../../compartido/ui/atomos/chip-filtro/chip-filtro.component';
import { ESTADOS_CAMBIO, EstadoCambio } from '../../modelos/cambios.model';
import { PRESENTACION_ESTADO } from '../../utilidades/etiquetas-cambio';

@Component({
  selector: 'app-cambios-resumen',
  standalone: true,
  imports: [ChipFiltroComponent],
  templateUrl: './cambios-resumen.component.html',
  styleUrl: './cambios-resumen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosResumenComponent {
  readonly conteo = input.required<Record<EstadoCambio, number>>();
  readonly estadoActivo = input<EstadoCambio | null>(null);

  readonly alSeleccionarEstado = output<EstadoCambio | null>();

  protected readonly ESTADOS_CAMBIO = ESTADOS_CAMBIO;
  protected readonly PRESENTACION_ESTADO = PRESENTACION_ESTADO;

  protected readonly total = computed(() =>
    ESTADOS_CAMBIO.reduce((suma, estado) => suma + this.conteo()[estado], 0),
  );
}
