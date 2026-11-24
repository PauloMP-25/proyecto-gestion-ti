import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TarjetaComponent } from '../../../../../compartido/ui/atomos/tarjeta/tarjeta.component';
import { InsigniaComponent } from '../../../../../compartido/ui/atomos/insignia/insignia.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { CambioResumen, ImpactoAsistencial } from '../../modelos/cambios.model';
import {
  PRESENTACION_ESTADO,
  PRESENTACION_IMPACTO,
  PRESENTACION_TIPO,
} from '../../utilidades/etiquetas-cambio';

const ACENTO_IMPACTO: Record<ImpactoAsistencial, string> = {
  BAJO: 'var(--color-border-strong)',
  MEDIO: 'var(--color-info-border)',
  ALTO: 'var(--color-aviso-border)',
  CRITICO: 'var(--color-error-border)',
};

@Component({
  selector: 'app-tarjeta-cambio',
  standalone: true,
  imports: [DatePipe, TarjetaComponent, InsigniaComponent, IconoComponent],
  templateUrl: './tarjeta-cambio.component.html',
  styleUrl: './tarjeta-cambio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaCambioComponent {
  readonly cambio = input.required<CambioResumen>();

  readonly alSeleccionar = output<number>();

  protected readonly PRESENTACION_ESTADO = PRESENTACION_ESTADO;
  protected readonly PRESENTACION_IMPACTO = PRESENTACION_IMPACTO;
  protected readonly PRESENTACION_TIPO = PRESENTACION_TIPO;

  protected readonly acento = computed(() => ACENTO_IMPACTO[this.cambio().impacto]);

  protected areasVisibles(): string {
    const areas = this.cambio().areasAfectadas;
    const visibles = areas.slice(0, 2);
    const resto = areas.length - visibles.length;
    const texto = visibles.join(', ');
    return resto > 0 ? `${texto} +${resto}` : texto;
  }

  protected mismoDia(inicioIso: string, finIso: string): boolean {
    const inicio = new Date(inicioIso);
    const fin = new Date(finIso);
    return (
      inicio.getFullYear() === fin.getFullYear() &&
      inicio.getMonth() === fin.getMonth() &&
      inicio.getDate() === fin.getDate()
    );
  }
}
