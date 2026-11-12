import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type TamanoIcono = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const MAPA_ALIAS_ICONOS: Record<string, string> = {
  // Navegación y flechas
  'arrow-left': 'arrow_back',
  'arrow_left': 'arrow_back',
  'arrow-right': 'arrow_forward',
  'arrow_right': 'arrow_forward',
  'arrow-up': 'arrow_upward',
  'arrow-down': 'arrow_downward',
  'chevron-right': 'chevron_right',
  'chevron-left': 'chevron_left',
  'chevron-down': 'keyboard_arrow_down',
  'chevron-up': 'keyboard_arrow_up',

  // Estados y alertas
  'alert-circle': 'error',
  'alert-triangle': 'warning',
  'check-circle': 'check_circle',
  'x-circle': 'cancel',
  'info-circle': 'info',
  'help-circle': 'help',

  // Acciones y controles
  'plus-circle': 'add_circle',
  'plus-o': 'add_circle',
  'plus': 'add',
  'x': 'close',
  'cross': 'close',
  'trash': 'delete',
  'trash-2': 'delete',
  'edit-2': 'edit',
  'edit-3': 'edit',
  'refresh-cw': 'refresh',
  'refresh-ccw': 'refresh',

  // Dispositivos y hardware
  'printer': 'print',
  'monitor': 'desktop_windows',
  'screen': 'desktop_windows',
  'hard-drive': 'storage',
  'shield': 'security',

  // Varios comunes
  'map-pin': 'location_on',
  'clock': 'schedule',
  'eye': 'visibility',
  'eye-off': 'visibility_off',
  'user': 'person',
  'users': 'group',
  'phone': 'call',
  'mail': 'email',
  'file-text': 'description',
  'folder': 'folder',
};

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
    if (MAPA_ALIAS_ICONOS[raw]) {
      return MAPA_ALIAS_ICONOS[raw];
    }
    return raw.replace(/-/g, '_');
  });
}
