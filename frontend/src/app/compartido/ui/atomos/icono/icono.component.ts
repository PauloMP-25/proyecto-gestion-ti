import { Component, ChangeDetectionStrategy, input, computed, isDevMode } from '@angular/core';
import { ICONOS, ICONO_LEGADO } from './iconos';

export type TamanoIcono = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-icono',
  standalone: true,
  templateUrl: './icono.component.html',
  styleUrl: './icono.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconoComponent {
  readonly nombre = input.required<string>();
  readonly tamano = input<TamanoIcono>('md');
  readonly etiqueta = input<string | undefined>(undefined);
  readonly relleno = input<boolean>(false);

  readonly iconoNormalizado = computed(() => {
    const raw = (this.nombre() || '').trim().toLowerCase();
    const norm = ICONO_LEGADO[raw] ?? raw.replace(/-/g, '_');
    if (isDevMode() && !(ICONOS as readonly string[]).includes(norm)) {
      console.warn(`[app-icono] Ícono no registrado en catálogo oficial: "${raw}" (normalizado: "${norm}")`);
    }
    return norm;
  });
}
