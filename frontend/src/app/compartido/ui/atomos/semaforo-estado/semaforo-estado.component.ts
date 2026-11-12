import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';

export type EstadoCompromiso = 'A_TIEMPO' | 'ALERTA' | 'INCUMPLIDO';

interface ConfigSemaforo {
  icono: string;
  texto: string;
  clase: string;
}

const CFG_SEMAFORO: Record<EstadoCompromiso, ConfigSemaforo> = {
  A_TIEMPO:   { icono: 'check_circle',    texto: 'A tiempo',   clase: 'semaforo--ok' },
  ALERTA:     { icono: 'hourglass_empty', texto: 'Por vencer', clase: 'semaforo--alerta' },
  INCUMPLIDO: { icono: 'warning',         texto: 'Vencido',    clase: 'semaforo--vencido' },
};

@Component({
  selector: 'app-semaforo-estado',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="semaforo" [class]="cfg().clase" [class.semaforo--compacto]="compacto()" [attr.title]="cfg().texto">
      <app-icono [nombre]="cfg().icono" tamano="xs" aria-hidden="true" />
      @if (!compacto()) {
        <span>{{ cfg().texto }}</span>
      }
    </span>
  `,
  styleUrl: './semaforo-estado.component.scss',
})
export class SemaforoEstadoComponent {
  readonly estado = input.required<string>();
  readonly compacto = input<boolean>(false);

  protected readonly estadoNormalizado = computed<EstadoCompromiso>(() => {
    const raw = (this.estado() || '').toUpperCase();
    if (raw === 'ALERTA' || raw === 'POR_VENCER') return 'ALERTA';
    if (raw === 'INCUMPLIDO' || raw === 'VENCIDO') return 'INCUMPLIDO';
    return 'A_TIEMPO';
  });

  protected readonly cfg = computed(() => CFG_SEMAFORO[this.estadoNormalizado()]);
}
