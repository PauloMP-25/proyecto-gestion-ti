import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';
import { nivelPrioridad } from '../../../utilidades/vocabulario-asistencial';

export type VarianteUrgencia = 'tecnica' | 'asistencial';

const CFG = {
  1: { icono: 'emergency', tecnico: 'P1 · Crítico', asistencial: 'Atención inmediata' },
  2: { icono: 'warning',   tecnico: 'P2 · Alto',    asistencial: 'Urgente' },
  3: { icono: 'schedule',  tecnico: 'P3 · Medio',   asistencial: 'Normal' },
  4: { icono: 'info',      tecnico: 'P4 · Bajo',    asistencial: 'Programada' },
} as const;

@Component({
  selector: 'app-badge-urgencia',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge badge--p' + nivel()" [class.badge--compacto]="compacto()">
      <app-icono [nombre]="cfg().icono" tamano="xs" aria-hidden="true" />
      <span class="badge__texto">{{ texto() }}</span>
    </span>
  `,
  styleUrl: './badge-urgencia.component.scss',
})
export class BadgeUrgenciaComponent {
  readonly prioridad = input.required<string>();
  readonly variante  = input<VarianteUrgencia>('tecnica');
  readonly compacto  = input(false);

  protected readonly nivel = computed(() => {
    try {
      return nivelPrioridad(this.prioridad());
    } catch {
      return 3;
    }
  });
  protected readonly cfg   = computed(() => CFG[this.nivel()]);
  protected readonly texto = computed(() =>
    this.compacto() ? `P${this.nivel()}` :
    this.variante() === 'asistencial' ? this.cfg().asistencial : this.cfg().tecnico
  );
}
